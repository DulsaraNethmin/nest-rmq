export class TopicPatternBuilder {
    private static readonly SINGLE_WORD = '*';
    private static readonly MULTIPLE_WORDS = '#';

    /**
     * Creates a pattern that matches exactly one word for the given position
     * @param parts - Array of routing key parts
     * @param position - Position to make dynamic (0-based)
     */
    static exactPosition(parts: string[], position: number): string {
        return parts
            .map((part, index) => (index === position ? this.SINGLE_WORD : part))
            .join('.');
    }

    /**
     * Creates a pattern that matches anything after a specific position
     * @param parts - Array of routing key parts
     * @param startPosition - Position to start matching anything (0-based)
     */
    static anythingAfter(parts: string[], startPosition: number): string {
        return [
            ...parts.slice(0, startPosition),
            this.MULTIPLE_WORDS,
        ].join('.');
    }

    /**
     * Creates a pattern for service events
     * @param service - Service name
     * @param eventType - Type of event (optional)
     */
    static serviceEvents(service: string, eventType?: string): string {
        if (eventType) {
            return `${service}.${eventType}.#`;
        }
        return `${service}.#`;
    }

    /**
     * Creates a pattern for entity events
     * @param entity - Entity name
     * @param action - Action type (optional)
     */
    static entityEvents(entity: string, action?: string): string {
        if (action) {
            return `*.${entity}.${action}`;
        }
        return `*.${entity}.*`;
    }
}