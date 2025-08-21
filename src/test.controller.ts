import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  hello() {
    return { message: 'Nest test endpoint works!' };
  }
}
