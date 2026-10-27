"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingModule = void 0;
const common_1 = require("@nestjs/common");
const common_module_1 = require("../common/common.module");
const documents_module_1 = require("../documents/documents.module");
const indexing_controller_1 = require("./indexing.controller");
const indexing_service_1 = require("./indexing.service");
const vector_strategy_1 = require("./strategies/vector.strategy");
const summary_strategy_1 = require("./strategies/summary.strategy");
const keyword_strategy_1 = require("./strategies/keyword.strategy");
const hybrid_strategy_1 = require("./strategies/hybrid.strategy");
let IndexingModule = class IndexingModule {
};
exports.IndexingModule = IndexingModule;
exports.IndexingModule = IndexingModule = __decorate([
    (0, common_1.Module)({
        imports: [common_module_1.CommonModule, documents_module_1.DocumentsModule],
        controllers: [indexing_controller_1.IndexingController],
        providers: [
            indexing_service_1.IndexingService,
            vector_strategy_1.VectorStrategy,
            summary_strategy_1.SummaryStrategy,
            keyword_strategy_1.KeywordStrategy,
            hybrid_strategy_1.HybridStrategy,
        ],
    })
], IndexingModule);
//# sourceMappingURL=indexing.module.js.map