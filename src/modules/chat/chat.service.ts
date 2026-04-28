import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SendMessageDto } from "./dtos/send-message.dto";
import { GetAllMessagesDto } from "./dtos/get-all-messages.dto";
import { GetUserRoomsDto } from "./dtos/get-user-rooms.dto";
import { SocketGateway } from "./gateway/chat.gateway";
import { RoomParticipantRole } from "generated/prisma/enums";
import { ChatRoom } from "generated/prisma/browser";

@Injectable()
export class ChatService {

    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    /**
     * Create a new message
     * @param userId 
     * @param sendMessageDto 
     * @returns 
     */
    async createMessage(userId: number, sendMessageDto: SendMessageDto) {

        if(!sendMessageDto.room_id && !sendMessageDto.receiver_id){
            throw new BadRequestException("Either room_id or receiver_id must be provided")
        }
        if(sendMessageDto.room_id && sendMessageDto.receiver_id){
            throw new BadRequestException("Only one of room_id or receiver_id should be provided")
        }
        
        // if( await this.isBlockExists(userId, sendMessageDto.receiver_id)){
        //     throw new BadRequestException("You can not messaged this account")
        // }
        let room:ChatRoom | null = null;
        if(sendMessageDto.receiver_id){
             room = await this.createChatRoomIfNotExists(userId, sendMessageDto.receiver_id);
        }
        if(sendMessageDto.room_id){
             room = await this.prismaService.chatRoom.findUnique({
                where:{id:sendMessageDto.room_id}
            });
        }

        if (!room) {
            throw new Error("Chat room not found");
        }

        const createdChat = await this.prismaService.chat.create({
            data: {
                chatRoom_id: room.id,
                sender_id: userId,
                receiver_id: sendMessageDto.receiver_id,
                message: sendMessageDto.message,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        nick_name: true,
                        avatar: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        nick_name: true,
                        avatar: true
                    }
                }
            },
        });

        await this.prismaService.chatRoom.update({
            where: { id: room.id },
            data: {
                updatedAt: new Date()
            }
        });

        return createdChat
    }

    private async isBlockExists(userId: number, receiverId: number) {
        const isBlockExist = await this.prismaService.blockList.findFirst({
            where: {
                OR: [
                    { blocker_id: userId, blocked_user_id: receiverId },
                    { blocked_user_id: receiverId, blocker_id: userId }
                ]
            }
        });
        return isBlockExist ? true : false;
    }

    /**
     * Create chat room if it doesn't exist
     * @param userId 
     * @param receiverId 
     * @returns 
     */
    private async createChatRoomIfNotExists(userId: number, receiverId: number) {
        
        const room = await this.getChatRoomIfExist(userId, receiverId);

        if (room) {
            return room;
        }

        const newRoom = await this.prismaService.chatRoom.create({data:{}});

        await this.createRoomMember(newRoom.id, userId, RoomParticipantRole.MEMBER);
        await this.createRoomMember(newRoom.id, receiverId, RoomParticipantRole.MEMBER);

        return newRoom;
    }


    private async createRoomMember(roomId: number, userId: number, role:RoomParticipantRole = RoomParticipantRole.MEMBER) {
        await this.prismaService.participant.create({
            data: {
                chatRoom_id: roomId,
                user_id: userId,
                role: role
            }
        });
    }


    async getChatRoomIfExist(userId: number, receiverId: number) {

         const room = await this.prismaService.chatRoom.findFirst({
            where: {
                participants:{every:{AND:[{user_id:userId}, {user_id:receiverId}]}}
            }
        });
        return room;

    }


    /**
     * Get user's chat rooms
     * @param userId 
     * @param getUserRoomsDto 
     * @returns 
     */
    async getUserChatRooms(userId: number, getUserRoomsDto: GetUserRoomsDto) {
        const skip = (getUserRoomsDto.page - 1) * getUserRoomsDto.limit;

        console.log("User id", userId)
        const [rooms, total] = await Promise.all([
            this.prismaService.chatRoom.findMany({
                where: {
                    participants:{some:{user_id:userId}}
                },
                include: {
                    user1: {
                        select: {
                            id: true,
                            nick_name: true,
                            licence_id: true,
                            avatar: true,
                        },
                    
                    },
                    user2: {
                        select: {
                            id: true,
                            nick_name: true,
                            licence_id: true,
                            avatar: true,
                        }
                    },
                    chats: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    nick_name: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            chats: {
                                where: {
                                    is_read: false,
                                    receiver_id: userId
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    updatedAt: "desc"
                },
                skip,
                take: getUserRoomsDto.limit
            }),
            this.prismaService.chatRoom.count({
                where: {
                    participants:{some:{user_id:userId}}
                }
            })
        ]);

        const mappedRoom = rooms.map(async ({ user1, user2, _count, chats, ...room }) => {
            // Get the other user (not the current user)
            const otherUser = room.user1_id === userId ? user2 : user1;
            const latestChat = chats[0];
            const is_latest_message_mine = latestChat?.sender_id === userId;
            const isBlockedByMe = await this.prismaService.blockList.findFirst({where:{user_id:userId, blocked_user_id:otherUser.id}})
            const isBlockedMe = await this.prismaService.blockList.findFirst({where:{user_id:otherUser.id, blocked_user_id:userId}})
            
            
            return {
                ...room,
                otherUser,
                latest_message: latestChat ? {
                    ...latestChat,
                    is_mine: is_latest_message_mine
                } : null,
                unread_count: _count.chats,
                isBlockedByMe:isBlockedByMe? true:false,
                isBlockedMe:isBlockedMe ? true:false
            };
        });

        return { rooms: await Promise.all(mappedRoom), total: total };
    }

    /**
     * Get messages in a chat room
     * @param userId 
     * @param getAllMessageDto 
     * @returns 
     */
    async getRoomMessages(userId: string, getAllMessageDto: GetAllMessagesDto) {
        const skip = (getAllMessageDto.page - 1) * getAllMessageDto.limit;


        const [messages, total] = await Promise.all([
            this.prismaService.chat.findMany({
                where: { chatRoom_id: getAllMessageDto.roomId },
                include: {
                    sender: {
                        select: {
                            id: true,
                            nick_name: true,
                            avatar: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            nick_name: true,
                            avatar: true
                        }
                    }
                },
                skip,
                take: getAllMessageDto.limit,
                orderBy: { createdAt: "desc" }
            }),
            this.prismaService.chat.count({
                where: { chatRoom_id: getAllMessageDto.roomId }
            })
        ]);

        // Mark messages as read
        await this.prismaService.chat.updateMany({
            where: {
                chatRoom_id: getAllMessageDto.roomId,
                receiver_id: userId,
                is_read: false
            },
            data: { is_read: true }
        });

        const mappedMessages = messages.map(message => {
            const is_mine = message.sender_id === userId;
            return { ...message, is_mine };
        });

        // const reversedMessages = mappedMessages.reverse();
        return { messages: mappedMessages, total };
    }

    /**
     * Acknowledge message delivery
     * @param messageId 
     * @returns 
     */
    async acknowledgeMessageDelivery(messageId: number) {
        const chat = await this.prismaService.chat.update({
            where: { id: messageId },
            data: { is_delivered: true, is_read: true }
        });

        return chat;
    }

    
}