"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function resolveDatabasePath() {
    let databasePath = process.env.DATABASE_PATH;
    if (!databasePath) {
        const projectRoot = path.resolve(__dirname, '..');
        databasePath = path.resolve(projectRoot, 'data', 'notes.db');
    }
    else if (!path.isAbsolute(databasePath)) {
        const projectRoot = path.resolve(__dirname, '..');
        databasePath = path.resolve(projectRoot, databasePath);
    }
    const dataDir = path.dirname(databasePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`✅ Created data directory: ${dataDir}`);
    }
    process.env.DATABASE_PATH = databasePath;
    return databasePath;
}
const databasePath = resolveDatabasePath();
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('\n=== Configuration ===');
    console.log('Database Path:', databasePath);
    console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'not set (default: rule-based)');
    console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `${process.env.GOOGLE_AI_API_KEY.substring(0, 15)}...` : 'not set');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'set' : 'not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('========================\n');
    app.enableCors({
        origin: '*',
        methods: '*',
        allowedHeaders: '*',
        credentials: false,
    });
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', '*');
        res.header('Access-Control-Allow-Headers', '*');
        res.header('Access-Control-Max-Age', '86400');
        if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
        }
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        disableErrorMessages: false,
    }));
    await app.listen(process.env.PORT ?? 3001);
    console.log(`🚀 Backend server running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
//# sourceMappingURL=main.js.map