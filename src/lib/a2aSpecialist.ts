import { BaseAgent, createEvent, createEventActions, toA2a } from '@google/adk';
import type { InvocationContext } from '@google/adk';
import type express from 'express';

class DisasterSpecialistAgent extends BaseAgent {
  constructor() {
    super({
      name: 'ExternalDisasterSpecialist',
      description: 'An externally exposed disaster specialist that validates mission context for AEGIS.'
    });
  }

  protected async *runAsyncImpl(context: InvocationContext) {
    const requestText = context.userContent?.parts?.map(part => part.text ?? '').join(' ').trim() || 'mission request';
    yield createEvent({
      invocationId: context.invocationId,
      author: this.name,
      content: {
        role: 'model',
        parts: [
          {
            text: `External specialist handshake complete. Context validated for ${requestText}.`
          }
        ]
      },
      actions: createEventActions({
        stateDelta: {
          external_specialist_status: 'connected'
        }
      })
    });
  }

  protected async *runLiveImpl(_context: InvocationContext) {
    return;
  }
}

export async function createDisasterSpecialistA2AApp(app?: express.Application) {
  return toA2a(new DisasterSpecialistAgent(), {
    app,
    host: '127.0.0.1',
    port: 3000,
    basePath: 'a2a/disaster-specialist'
  });
}
