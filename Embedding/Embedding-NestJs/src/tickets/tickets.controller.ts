import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { TicketsService } from '../tickets/tickets.service';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * GET /tickets
   * Returns the full list of support tickets loaded from synthetic_tickets.json.
   */
  @Get()
  @ApiOperation({
    summary: 'List all tickets',
    description: 'Returns the complete list of support tickets loaded from the synthetic dataset.',
  })
  @ApiOkResponse({
    description: 'Array of all support tickets with count.',
    schema: {
      example: {
        count: 50,
        tickets: [
          {
            ticket_id: 'TKT-001',
            title: 'Login issues after password reset',
            description: 'Users report being unable to log in...',
            category: 'Authentication',
            priority: 'High',
          },
        ],
      },
    },
  })
  getAll() {
    const tickets = this.ticketsService.getAll();
    return {
      count: tickets.length,
      tickets,
    };
  }
}
