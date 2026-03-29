type QueueTask<T> = () => Promise<T>;

interface QueueState {
  active: boolean;
  tail: Promise<unknown>;
}

class WorkerQueueManager {
  private queues = new Map<string, QueueState>();

  enqueue<T>(queueName: string, task: QueueTask<T>): Promise<T> {
    const current = this.queues.get(queueName) ?? { active: false, tail: Promise.resolve() };

    const next = current.tail
      .catch(() => undefined)
      .then(async () => {
        current.active = true;
        try {
          return await task();
        } finally {
          current.active = false;
        }
      });

    current.tail = next;
    this.queues.set(queueName, current);
    return next;
  }

  snapshot() {
    return Array.from(this.queues.entries()).map(([name, state]) => ({
      name,
      active: state.active
    }));
  }
}

export const workerQueues = new WorkerQueueManager();
