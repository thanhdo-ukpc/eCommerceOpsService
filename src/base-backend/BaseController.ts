import { BaseModel, FindProps, ListProps, Paging, CountProps } from '@Core';
import { Body, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { BaseService } from './BaseService';
import { IBaseController } from './IBaseController';

export class BaseController<T extends BaseModel, S extends BaseService<T> = BaseService<T>>
    implements IBaseController<T>
{
    service: S;

    constructor(service: S) {
        this.service = service;
    }
  
    @Post('bulk-upsert')
    bulkUpsert(@Body() body: { list: T[] }): Promise<T[]> {
        return this.service.bulkUpsert(body);
    }
    @Post('findOne')
    findOne(props: Omit<FindProps<T>, 'limit'>): Promise<T> {
        return this.service.findOne(props);
    }
    

    @Get('/:id')
    get(@Param('id', ParseIntPipe) id: number): Promise<T> {
        return this.service.get(id);
    }

    @Post()
    upsert(@Body() t: T): Promise<T> {
        return this.service.upsert(t);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number): Promise<T> {
        return this.service.delete(id);
    }

    @Post('filter')
    list(@Body() props: ListProps<T>): Promise<Paging<T>> {
        return this.service.list(props);
    }

    @Post('find')
    find(props: FindProps<T>): Promise<T[]> {
        return this.service.find(props);
    }

    @Post('count')
    count(props: CountProps<T>): Promise<number> {
        return this.service.count(props);
    }
}
