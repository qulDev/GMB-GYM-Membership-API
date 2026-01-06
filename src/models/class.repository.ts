import { prisma } from "../config/database.config";

export class GymClassRepository {

  static create(data: any) {
    return prisma.gymClass.create({ data });
  }

  static findAll() {
    return prisma.gymClass.findMany({
      where: { status: { not: "CANCELLED" }},
      include: { trainer: true }
    });
  }

  static findById(id: string) {
    return prisma.gymClass.findUnique({
      where: { id },
      include: { trainer: true, bookings: true }
    });
  }

  static update(id: string, data: any) {
    return prisma.gymClass.update({ where: { id }, data });
  }

    static delete(id: string) {
    return prisma.gymClass.delete({ where: { id } });
  }
}
