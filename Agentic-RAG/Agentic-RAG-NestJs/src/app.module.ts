import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { SupportTicketService } from './support-ticket.service';

@Module({ controllers: [AgentController], providers: [AgentService, SupportTicketService] })
export class AppModule {}
