import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  @Get('holiday')
  @ApiOperation({ summary: 'Generate a new holiday idea using AI' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns a streamed text response with a generated holiday concept and traditions'
  })
  async generateHoliday(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    const result = streamText({
      model: xai('grok-2-1212'),
      prompt: 'Invent a new holiday and describe its traditions.',
    });

    for await (const textPart of result.textStream) {
      res.write(textPart);
    }

    res.end();
  }
}
