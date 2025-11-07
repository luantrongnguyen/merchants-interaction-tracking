"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('\n=== AI Configuration ===');
    console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'not set (default: rule-based)');
    console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `${process.env.GOOGLE_AI_API_KEY.substring(0, 15)}...` : 'not set');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'set' : 'not set');
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