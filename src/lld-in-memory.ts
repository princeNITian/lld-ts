// Map

type Order = { id: string, name: string , price: number };

const order: Order = { id: "ORD-001", name: "iPhone 17", price: 82900 }
const orders = new Map<string, Order>();

orders.set("ORD-001", order);

console.log(orders.get("ORD-001"));


// Set

const processedPayments = new Set<string>();
processedPayments.add("PAY-001");
processedPayments.add("PAY-002");

if (processedPayments.has("PAY-001")) {
    console.log("PAY-001....")
}


// Array

const recentOrders: Order[] = [];
recentOrders.push(order);

recentOrders.forEach(o => console.log(o.id + ": "+ o.name));

// Built-In Memory Repository

interface Entity {
  id: string;
}

class DuplicateEntityError extends Error {
  constructor(id: string) {
    super(`Entity with id "${id}" already exists`);
    this.name = "DuplicateEntityError";
  }
}

class EntityNotFoundError extends Error {
  constructor(id: string) {
    super(`Entity with id "${id}" not found`);
    this.name = "EntityNotFoundError";
  }
}

class InMemoryRepository<T extends Entity> {
  private readonly storage = new Map<string, T>();

  create(entity: T): T {
    if (this.storage.has(entity.id)) {
      throw new DuplicateEntityError(entity.id);
    }

    const saved = structuredClone(entity);
    this.storage.set(saved.id, saved);

    return structuredClone(saved);
  }

  findById(id: string): T | undefined {
    const entity = this.storage.get(id);

    return entity ? structuredClone(entity) : undefined;
  }

  findAll(): T[] {
    return structuredClone([...this.storage.values()]);
  }

  update(id: string, changes: Partial<Omit<T, "id">>): T {
    const existing = this.storage.get(id);

    if (!existing) {
      throw new EntityNotFoundError(id);
    }

    const updated = {
      ...existing,
      ...changes,
      id,
    } as T;

    const saved = structuredClone(updated);
    this.storage.set(id, saved);

    return structuredClone(saved);
  }

  delete(id: string): boolean {
    return this.storage.delete(id);
  }

  count(): number {
    return this.storage.size;
  }
}


// Test with Real Entity
interface Payment extends Entity {
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  metadata: {
    source: string;
  };
}

const payments = new InMemoryRepository<Payment>();

payments.create({
  id: "PAY101",
  amount: 500,
  status: "PENDING",
  metadata: { source: "UPI" },
});

payments.update("PAY101", {
  status: "SUCCESS",
});

console.log(payments.findById("PAY101"));
console.log(payments.count());


// Another Test
interface Retailer extends Entity {
  name: string;
  pincode: string;
}

const retailers = new InMemoryRepository<Retailer>();

retailers.create({
  id: "RET101",
  name: "City Pharmacy",
  pincode: "560100",
});

console.log(retailers.findAll())