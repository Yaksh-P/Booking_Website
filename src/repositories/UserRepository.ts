import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "../config/database";
import { User } from "../entities/User";

export function createUserRepository() {
  const list = () =>
    readCollection<User>("users").sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );

  const findById = (id: string) => list().find((user) => user.id === id);

  const findByEmail = (email: string) =>
    list().find((user) => user.email === email.toLowerCase());

  const create = (user: Omit<User, "id" | "createdAt">) => {
    const users = list();

    const createdUser: User = {
      ...user,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    users.push(createdUser);
    writeCollection("users", users);

    return createdUser;
  };

  return {
    list,
    findById,
    findByEmail,
    create,
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
