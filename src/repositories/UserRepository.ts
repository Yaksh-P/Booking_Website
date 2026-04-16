import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "../config/database";
import { User } from "../entities/User";

export class UserRepository {
  list() {
    return readCollection<User>("users").sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  findById(id: string) {
    return this.list().find((user) => user.id === id);
  }

  findByEmail(email: string) {
    return this.list().find((user) => user.email === email.toLowerCase());
  }

  create(user: Omit<User, "id" | "createdAt">) {
    const users = this.list();

    const createdUser: User = {
      ...user,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    users.push(createdUser);
    writeCollection("users", users);

    return createdUser;
  }
}
