import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkingService],
    }).compile();

    service = module.get<ChunkingService>(ChunkingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('splitByFixedSize', () => {
    it('should split text into fixed-size chunks', () => {
      const text = 'a'.repeat(500);
      const chunks = service.splitByFixedSize(text, 200, 20);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].length).toBe(200);
    });

    it('should return a single chunk if text is smaller than chunk size', () => {
      const text = 'short text';
      const chunks = service.splitByFixedSize(text, 200, 20);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe('short text');
    });
  });

  describe('splitTextRecursive', () => {
    it('should split on paragraph breaks', () => {
      const text = 'Para one.\n\nPara two.\n\nPara three.';
      const chunks = service.splitTextRecursive(text, ['\n\n', '\n', '. ', ' '], 300, 50);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('splitMarkdown', () => {
    it('should split markdown by headers', () => {
      const md = `# Title\n\nContent under title.\n\n## Section\n\nSection content.`;
      const chunks = service.splitMarkdown(md);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].metadata['header']).toBe('Title');
    });
  });

  describe('createDocument', () => {
    it('should create a document from a ticket', () => {
      const ticket = {
        ticket_id: 'T001',
        title: 'Test Ticket',
        category: 'Auth',
        priority: 'High',
        description: 'Test description',
        resolution: 'Test resolution',
      };
      const doc = service.createDocument(ticket);
      expect(doc.pageContent).toContain('Ticket ID: T001');
      expect(doc.metadata['ticket_id']).toBe('T001');
      expect(doc.metadata['category']).toBe('Auth');
    });
  });

  describe('LangChainVectorStore', () => {
    it('should return similarity search results', () => {
      const { LangChainVectorStore } = require('./chunking.service');
      const docs = [
        service.createDocument({ ticket_id: 'T1', title: 'Login Error', category: 'Auth', priority: 'High', description: 'Cannot login after password reset', resolution: 'Reset password again' }),
        service.createDocument({ ticket_id: 'T2', title: 'DB Timeout', category: 'Database', priority: 'Medium', description: 'Database times out', resolution: 'Increase timeout' }),
      ];
      const store = new LangChainVectorStore(docs);
      const results = store.similaritySearch('login authentication', 1);
      expect(results.length).toBe(1);
    });
  });
});
