"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let DocumentsService = DocumentsService_1 = class DocumentsService {
    constructor() {
        this.logger = new common_1.Logger(DocumentsService_1.name);
        this.documents = [];
    }
    onModuleInit() {
        const possiblePaths = [
            path.join(__dirname, '..', 'data', 'synthetic_tickets.json'),
            path.join(__dirname, 'data', 'synthetic_tickets.json'),
            path.join(process.cwd(), 'src', 'data', 'synthetic_tickets.json'),
            path.join(process.cwd(), 'synthetic_tickets.json'),
        ];
        let ticketsPath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                ticketsPath = p;
                break;
            }
        }
        if (!ticketsPath) {
            this.logger.error('Could not find synthetic_tickets.json. Checked paths: ' + possiblePaths.join(', '));
            this.documents = [];
            return;
        }
        const raw = fs.readFileSync(ticketsPath, 'utf-8');
        const tickets = JSON.parse(raw);
        this.documents = tickets.map((ticket) => {
            const content = [
                `Ticket ID: ${ticket.ticket_id}`,
                `Title: ${ticket.title}`,
                `Description: ${ticket.description}`,
                `Resolution: ${ticket.resolution}`,
                `Category: ${ticket.category}`,
                `Priority: ${ticket.priority}`,
            ].join('\n');
            return {
                id: ticket.ticket_id,
                text: content,
                metadata: {
                    ticket_id: ticket.ticket_id,
                    category: ticket.category,
                    priority: ticket.priority,
                    title: ticket.title,
                },
            };
        });
        this.logger.log(`✓ Loaded ${this.documents.length} ticket documents from ${ticketsPath}`);
    }
    getAll() {
        return this.documents;
    }
    count() {
        return this.documents.length;
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = DocumentsService_1 = __decorate([
    (0, common_1.Injectable)()
], DocumentsService);
//# sourceMappingURL=documents.service.js.map