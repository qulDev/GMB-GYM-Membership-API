import { prisma } from "../config/database.config";
import { CreateGymClassInput, UpdateGymClassInput, GymClassQuery } from "../types/class.types";

export class GymClassService {

  static create(data: CreateGymClassInput) {
    return prisma.gymClass.create({
      data: {
        ...data,
        schedule: new Date(data.schedule)
      }
    });
  }

  static update(id: string, data: UpdateGymClassInput) {
    return prisma.gymClass.update({
      where: { id },
      data: {
        ...data,
        schedule: data.schedule ? new Date(data.schedule) : undefined
      }
    });
  }

  static delete(id: string) {
    return prisma.gymClass.delete({ where: { id } });
  }

  static getAll(query: GymClassQuery) {
    return prisma.gymClass.findMany({
      where: {
        status: query.status,
        trainerId: query.trainerId,
        type: query.type,
        name: query.search ? { contains: query.search, mode: "insensitive" } : undefined
      },
      orderBy: { schedule: "asc" },
      include: { trainer: true }
    });
  }

  static getById(id: string) {
    return prisma.gymClass.findUnique({
      where: { id },
      include: { trainer: true, bookings: true }
    });
  }
}
