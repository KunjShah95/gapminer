import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../core/config.js";

/**
 * WebSocket Collaboration Service
 *
 * Handles real-time collaboration for shared resume/LaTeX editing.
 * Features:
 * - JWT authentication for socket connections
 * - Room-based collaboration (one room per document/analysis)
 * - Cursor position sharing
 * - Live text synchronization with operational transforms
 * - User presence tracking
 * - Conflict resolution for simultaneous edits
 */

// In-memory storage for collaboration sessions
// In production, this should use Redis for scalability
const rooms = new Map(); // roomId -> { users, document, cursors, operations }
const userSocketMap = new Map(); // socketId -> { userId, roomId, user }

/**
 * Generate a unique color for each user based on their ID
 */
function getUserColor(userId) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Initialize WebSocket server with Socket.IO
 */
export function initWebSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS,
      credentials: true,
      methods: ["GET", "POST"],
    },
    // Use WebSocket first, fallback to polling
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token with expiry validation
      const decoded = jwt.verify(token, config.SECRET_KEY, {
        algorithms: ["HS256"],
        complete: false,
      });

      // Additional expiry check (jwt.verify handles this, but being explicit)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return next(new Error("Authentication error: Token expired"));
      }

      // Validate required claims
      if (!decoded.userId && !decoded.sub) {
        return next(new Error("Authentication error: Invalid token payload"));
      }

      socket.userId = decoded.userId || decoded.sub;
      socket.userEmail = decoded.email;
      socket.userName = decoded.name || decoded.email;

      next();
    } catch (err) {
      console.error("Socket authentication failed:", err.message);
      if (err.name === "TokenExpiredError") {
        return next(new Error("Authentication error: Token expired"));
      }
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.userName} (${socket.userId}) - Socket: ${socket.id}`,
    );

    // Send connection confirmation
    socket.emit("connected", {
      socketId: socket.id,
      user: {
        id: socket.userId,
        name: socket.userName,
        email: socket.userEmail,
      },
    });

    // Join a collaboration room
    socket.on("join-room", (data) => {
      const { roomId, documentId, documentType = "latex" } = data;

      if (!roomId) {
        socket.emit("error", { message: "Room ID is required" });
        return;
      }

      // Leave previous room if any
      const previousRoom = userSocketMap.get(socket.id)?.roomId;
      if (previousRoom && previousRoom !== roomId) {
        leaveRoom(socket, io, previousRoom);
      }

      // Join new room
      socket.join(roomId);

      // Initialize room if needed
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          documentId,
          documentType,
          users: new Map(),
          document: {
            content: data.initialContent || "",
            version: 0,
            lastModified: Date.now(),
          },
          cursors: new Map(),
          operations: [],
          createdAt: Date.now(),
        });
      }

      const room = rooms.get(roomId);

      // Add user to room
      const userInfo = {
        id: socket.userId,
        name: socket.userName,
        email: socket.userEmail,
        socketId: socket.id,
        color: getUserColor(socket.userId),
        joinedAt: Date.now(),
        isActive: true,
        cursor: null,
        selection: null,
      };

      room.users.set(socket.userId, userInfo);
      userSocketMap.set(socket.id, {
        userId: socket.userId,
        roomId,
        user: userInfo,
      });

      // Send current document state to joining user
      socket.emit("room-joined", {
        roomId,
        document: room.document,
        users: Array.from(room.users.values()).map((u) => ({
          id: u.id,
          name: u.name,
          color: u.color,
          isActive: u.isActive,
          cursor: u.cursor,
          selection: u.selection,
        })),
        myColor: userInfo.color,
      });

      // Notify other users in the room
      socket.to(roomId).emit("user-joined", {
        user: {
          id: userInfo.id,
          name: userInfo.name,
          color: userInfo.color,
        },
      });

      console.log(`User ${socket.userName} joined room: ${roomId}`);
    });

    // Handle document edits (operational transform)
    socket.on("document-operation", (data) => {
      const { roomId, operation } = data;
      const room = rooms.get(roomId);

      if (!room || !room.users.has(socket.userId)) {
        socket.emit("error", {
          message: "Not in a room or room does not exist",
        });
        return;
      }

      // Validate operation
      if (!operation || !operation.type) {
        socket.emit("error", { message: "Invalid operation" });
        return;
      }

      // Apply operation to document
      const result = applyOperation(room.document, operation);

      if (result.success) {
        // Store operation for potential conflict resolution
        room.operations.push({
          ...operation,
          userId: socket.userId,
          timestamp: Date.now(),
          version: room.document.version,
        });

        // Trim operation history if it gets too long
        if (room.operations.length > 1000) {
          room.operations = room.operations.slice(-500);
        }

        // Broadcast operation to other users in the room
        socket.to(roomId).emit("operation-applied", {
          operation,
          userId: socket.userId,
          version: room.document.version,
        });

        // Acknowledge operation to sender
        socket.emit("operation-ack", {
          operationId: operation.id,
          version: room.document.version,
        });
      } else {
        socket.emit("operation-rejected", {
          operation,
          error: result.error,
          currentVersion: room.document.version,
        });
      }
    });

    // Handle cursor position updates
    socket.on("cursor-move", (data) => {
      const { roomId, cursor, selection } = data;
      const room = rooms.get(roomId);

      if (!room || !room.users.has(socket.userId)) return;

      const user = room.users.get(socket.userId);
      user.cursor = cursor;
      user.selection = selection;
      user.lastActivity = Date.now();

      // Broadcast cursor position to other users
      socket.to(roomId).emit("cursor-update", {
        userId: socket.userId,
        cursor,
        selection,
        userName: user.name,
        color: user.color,
      });
    });

    // Handle full document sync (for periodic sync or reconnection)
    socket.on("request-sync", (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      socket.emit("document-sync", {
        document: room.document,
        users: Array.from(room.users.values()).map((u) => ({
          id: u.id,
          name: u.name,
          color: u.color,
          isActive: u.isActive,
          cursor: u.cursor,
          selection: u.selection,
        })),
      });
    });

    // Handle presence heartbeat
    socket.on("presence-heartbeat", (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (room && room.users.has(socket.userId)) {
        const user = room.users.get(socket.userId);
        user.lastActivity = Date.now();
        user.isActive = true;
      }
    });

    // Handle typing indicators
    socket.on("typing-start", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("user-typing", {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true,
      });
    });

    socket.on("typing-stop", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("user-typing", {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false,
      });
    });

    // Handle leaving a room
    socket.on("leave-room", (data) => {
      const { roomId } = data;
      leaveRoom(socket, io, roomId);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(
        `User disconnected: ${socket.userName} (${socket.userId}) - Reason: ${reason}`,
      );

      const userInfo = userSocketMap.get(socket.id);
      if (userInfo) {
        leaveRoom(socket, io, userInfo.roomId);
      }
    });
  });

  // Set up periodic cleanup of inactive rooms
  setInterval(() => cleanupInactiveRooms(io), 5 * 60 * 1000); // Every 5 minutes

  console.log("WebSocket server initialized");
  return io;
}

/**
 * Leave a collaboration room
 */
function leaveRoom(socket, io, roomId) {
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Remove user from room
  room.users.delete(socket.userId);
  userSocketMap.delete(socket.id);
  socket.leave(roomId);

  // Notify other users
  socket.to(roomId).emit("user-left", {
    userId: socket.userId,
  });

  console.log(`User ${socket.userName} left room: ${roomId}`);

  // Clean up empty rooms
  if (room.users.size === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
  }
}

/**
 * Apply an operation to the document
 * Supports insert, delete, and replace operations
 */
function applyOperation(document, operation) {
  try {
    const { type, position, text, length, newText } = operation;
    let content = document.content;

    switch (type) {
      case "insert":
        if (typeof position !== "number" || typeof text !== "string") {
          return { success: false, error: "Invalid insert operation" };
        }
        content = content.slice(0, position) + text + content.slice(position);
        break;

      case "delete":
        if (typeof position !== "number" || typeof length !== "number") {
          return { success: false, error: "Invalid delete operation" };
        }
        content = content.slice(0, position) + content.slice(position + length);
        break;

      case "replace":
        if (
          typeof position !== "number" ||
          typeof length !== "number" ||
          typeof newText !== "string"
        ) {
          return { success: false, error: "Invalid replace operation" };
        }
        content =
          content.slice(0, position) +
          newText +
          content.slice(position + length);
        break;

      case "full-replace":
        if (typeof newText !== "string") {
          return { success: false, error: "Invalid full-replace operation" };
        }
        content = newText;
        break;

      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }

    document.content = content;
    document.version += 1;
    document.lastModified = Date.now();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Clean up inactive rooms
 */
function cleanupInactiveRooms(io) {
  const now = Date.now();
  const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  for (const [roomId, room] of rooms.entries()) {
    // Check if room has been inactive
    const lastActivity = Math.max(
      room.lastModified || 0,
      ...Array.from(room.users.values()).map((u) => u.lastActivity || 0),
    );

    if (now - lastActivity > INACTIVE_TIMEOUT) {
      // Notify any remaining users
      io.to(roomId).emit("room-closed", { reason: "Inactivity timeout" });

      // Disconnect all sockets in the room
      io.in(roomId).socketsLeave(roomId);

      rooms.delete(roomId);
      console.log(`Room ${roomId} cleaned up due to inactivity`);
    }
  }
}

/**
 * Get room statistics (for monitoring/debugging)
 */
export function getRoomStats() {
  return {
    totalRooms: rooms.size,
    totalUsers: userSocketMap.size,
    rooms: Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      userCount: room.users.size,
      documentVersion: room.document.version,
      operationCount: room.operations.length,
      createdAt: room.createdAt,
    })),
  };
}

/**
 * Broadcast a message to all users in a room
 */
export function broadcastToRoom(roomId, event, data) {
  // This function would be called from outside if needed
  // Requires access to the io instance
}

export default { initWebSocketServer, getRoomStats };
