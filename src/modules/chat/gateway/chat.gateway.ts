import { forwardRef, Inject, Injectable, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "../chat.service";
import { EMIT_EVENTS, SUBSCRIBED_EVENTS } from "../enums/events.enum";
import { SendMessageDto } from "../dtos/send-message.dto";
import { UserService } from "src/modules/user/user.service";
import { plainToInstance } from "class-transformer";
import { AllMessageDto } from "../dtos/all-message.dto";
import { GetAllMessagesDto } from "../dtos/get-all-messages.dto";
import { GetUserRoomsDto } from "../dtos/get-user-rooms.dto";
import { AllUserRoomsDto } from "../dtos/all-user-rooms.dto";
import { MessageAcknowledgementDto } from "../dtos/message-acknowledgement.dto";
import { WsExceptionsFilter } from "src/common/exceptions/WsExceptionHandler";
import { SocketRegistryService } from "../services/socket-registry.service";
import { SocketAuthService } from "../services/socket-auth.service";

@WebSocketGateway({
    cors: {
        origin: "http://10.10.20.44:3000"
    }
})
@UsePipes(
    new ValidationPipe({
        transform: true,
        whitelist: true,
    }),
)
@UseFilters(WsExceptionsFilter)
@Injectable()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server

    constructor(
        private readonly chatService: ChatService,
        private readonly userService: UserService,
        private readonly socketRegistry: SocketRegistryService,
        private readonly socketAuth: SocketAuthService
    ) {}

    async handleDisconnect(client: Socket) {
        console.log(`client disconnected: ${client.id}`);
        try {
            await this.socketRegistry.removeUserSocket(client.id);
            const userId = client.data.userId;
            if (userId) {
                console.log(`User ${userId} removed from socket registry.`);
            }
        } catch (err: any) {
            console.error(`Error handling disconnect for socket ${client.id}:`, err);
        }
    }

    async handleConnection(client: Socket, ...args: any[]) {
        console.log(`client connected: ${client.id}`);

        try {
            // Authenticate using JWT token from handshake
            const jwtPayload = this.socketAuth.authenticateSocket(client.handshake);
            const userId = jwtPayload.id.toString();
            const userEmail = jwtPayload.email;

            // Verify user still exists in database
            const user = await this.userService.getUserById(jwtPayload.id);
            if (!user) {
                throw new Error("User not found");
            }

            // Store the userId and its associated socket ID in Redis
            await this.socketRegistry.setUserSocket(userId, client.id);
            
            // Store user info in socket for later use
            client.data.userId = userId;
            client.data.userEmail = userEmail;
            client.data.userRole = jwtPayload.role;

            client.emit(EMIT_EVENTS.SUCCESS, { 
                message: "User Successfully Connected With Socket",
                userId: userId,
                email: userEmail
            });

        } catch (err: any) {
            console.error("Connection error:", err);
            client.disconnect();
            throw new WsException({ message: err.message });
        }
    }

    afterInit(server: any) {
        console.log("Websocket server initialized");
    }

    @SubscribeMessage("greeting")
    handleGreeting(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            client.emit("greeting-response", { message: `Hello user ${userId}` });
        }
    }

    /**
     * Handle sending messages between users
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.MESSAGE)
    async handleChat(@MessageBody() data: SendMessageDto, @ConnectedSocket() client: Socket) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const userIdNumber = parseInt(userId, 10);

            console.log("Message data:", data);

            const chat = await this.chatService.createMessage(userIdNumber, data);

            if (!data.receiver_id) {
                throw new Error("receiver_id is required");
            }

            // Get socket ID from Redis for receiver and sender
            const receiverSocketId = await this.socketRegistry.getUserSocket(
                data.receiver_id.toString()
            );
            const senderSocketId = await this.socketRegistry.getUserSocket(userId);

            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit(EMIT_EVENTS.NEW_MESSAGE, {
                    ...chat,
                    is_mine: false,
                });
            }

            if (senderSocketId) {
                this.server.to(senderSocketId).emit(EMIT_EVENTS.MESSAGE_SENT, {
                    ...chat,
                    is_mine: true,
                });
            }
        } catch (err: any) {
            console.error("Chat error:", err);
            throw new WsException({ message: err.message });
        }
    }

    /**
     * Handle message delivery acknowledgement
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.MESSAGE_RECEIVED)
    async handleMessageDelivery(
        @MessageBody() acknowledgements: MessageAcknowledgementDto,
        @ConnectedSocket() client: Socket
    ) {
        try {
            for (const messageId of acknowledgements.messageIds) {
                const messageIdNumber = parseInt(messageId.toString(), 10);
                if (isNaN(messageIdNumber)) {
                    console.warn(`Invalid messageId: ${messageId}`);
                    continue;
                }

                const chat = await this.chatService.acknowledgeMessageDelivery(
                    messageIdNumber
                );
                const senderSocketId = await this.socketRegistry.getUserSocket(
                    chat.sender_id.toString()
                );

                if (senderSocketId) {
                    this.server.to(senderSocketId).emit(EMIT_EVENTS.MESSAGE_DELIVERED, chat);
                }
            }
        } catch (err: any) {
            console.error("Message delivery acknowledgement error:", err);
            throw new WsException({ message: err.message });
        }
    }

    /**
     * Handle file sending
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.SEND_FILE)
    async handleFile(
        @MessageBody() data: { receiverId: string; chat: any },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const socketId = await this.socketRegistry.getUserSocket(data.receiverId);

            if (socketId) {
                this.server.to(socketId).emit(EMIT_EVENTS.NEW_MESSAGE, data.chat);
            }
        } catch (err: any) {
            console.error("File sending error:", err);
            throw new WsException({ message: err.message });
        }
    }

    /**
     * Get all user chat rooms
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.FETCH_CHAT_ROOMS)
    async getAllUserRooms(
        @MessageBody() getUserRoomsDto: GetUserRoomsDto,
        @ConnectedSocket() client: Socket
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const userIdNumber = parseInt(userId, 10);

            const rooms = await this.chatService.getUserChatRooms(
                userIdNumber,
                getUserRoomsDto
            );
            console.log("User rooms:", rooms);

            const roomDto = plainToInstance(AllUserRoomsDto, rooms, {
                excludeExtraneousValues: true,
            });

            const socketId = await this.socketRegistry.getUserSocket(userId);

            if (socketId) {
                this.server.to(socketId).emit(EMIT_EVENTS.ALL_CHAT_ROOMS, roomDto);
            }
        } catch (err: any) {
            console.error("Fetch chat rooms error:", err);
            throw new WsException({ message: err.message });
        }
    }

    /**
     * Get all messages in a room
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.FETCH_MESSAGES)
    async getAllRoomMessages(
        @MessageBody() getAllMessageDto: GetAllMessagesDto,
        @ConnectedSocket() client: Socket
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const userIdNumber = parseInt(userId, 10);

            const messages = await this.chatService.getRoomMessages(
                userIdNumber,
                getAllMessageDto
            );

            const socketId = await this.socketRegistry.getUserSocket(userId);

            const messageDto = plainToInstance(AllMessageDto, messages, {
                excludeExtraneousValues: true,
            });

            if (socketId) {
                this.server.to(socketId).emit(EMIT_EVENTS.ALL_MESSAGES, messageDto);
            }
        } catch (err: any) {
            console.error("Fetch messages error:", err);
            throw new WsException({ message: err.message });
        }
    }

    /**
     * Subscribe user to a room
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.SUBSCRIBE_ROOM)
    async subscribeToRoom(
        @MessageBody() data: { roomId: number },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const userIdNumber = parseInt(userId, 10);
            await this.socketRegistry.subscribeToRoom(data.roomId, userIdNumber.toString());
            console.log(`User ${userIdNumber} subscribed to room ${data.roomId}`);
        } catch (err: any) {
            console.error("Subscribe to room error:", err);
            throw new WsException({ message: err.message });
        }
    }

    /**
     * Unsubscribe user from a room
     */
    @SubscribeMessage(SUBSCRIBED_EVENTS.UNSUBSCRIBE_ROOM)
    async unsubscribeFromRoom(
        @MessageBody() data: { roomId: number },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const userIdNumber = parseInt(userId, 10);
            await this.socketRegistry.unsubscribeFromRoom(
                data.roomId,
                userIdNumber.toString()
            );
            console.log(`User ${userIdNumber} unsubscribed from room ${data.roomId}`);
        } catch (err: any) {
            console.error("Unsubscribe from room error:", err);
            throw new WsException({ message: err.message });
        }
    }
}