import { Module } from '@nestjs/common';
import { ImsProxyController } from './ims-proxy.controller';
import { ImsProxyService } from './ims-proxy.service';

@Module({
  controllers: [ImsProxyController],
  providers: [ImsProxyService],
  exports: [ImsProxyService],
})
export class ImsProxyModule {}





