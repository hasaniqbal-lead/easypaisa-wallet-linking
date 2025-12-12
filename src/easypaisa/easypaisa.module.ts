import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EasypaisaService } from './easypaisa.service';
import { SignatureService } from './signature.service';

@Module({
  imports: [HttpModule],
  providers: [EasypaisaService, SignatureService],
  exports: [EasypaisaService, SignatureService],
})
export class EasypaisaModule {}
