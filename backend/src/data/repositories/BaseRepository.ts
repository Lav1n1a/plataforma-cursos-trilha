import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';

export default class BaseRepository {

    protected prisma: PrismaClient;

    constructor(){
        this.prisma = prisma;
    }
}
