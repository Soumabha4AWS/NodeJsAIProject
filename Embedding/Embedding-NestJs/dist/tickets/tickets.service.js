"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TicketsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
let TicketsService = TicketsService_1 = class TicketsService {
    constructor() {
        this.logger = new common_1.Logger(TicketsService_1.name);
        this.tickets = [];
    }
    async onModuleInit() {
        await this.loadTickets();
    }
    async loadTickets() {
        const filePath = path.join(process.cwd(), 'synthetic_tickets.json');
        this.logger.log(`Loading tickets from: ${filePath}`);
        const raw = await fs.readFile(filePath, 'utf8');
        this.tickets = JSON.parse(raw);
        this.logger.log(`✓ Loaded ${this.tickets.length} support tickets`);
    }
    getAll() {
        return this.tickets;
    }
    getById(ticketId) {
        return this.tickets.find((t) => t.ticket_id === ticketId);
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = TicketsService_1 = __decorate([
    (0, common_1.Injectable)()
], TicketsService);
//# sourceMappingURL=tickets.service.js.map