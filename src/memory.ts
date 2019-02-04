/**
 * @module memory
 */

/** @ignore */
export interface Namespace<VT = any> {
    [key: string]: Namespace<any> | VT | undefined;

    __value?: VT;
}

/**
 * Like [[enterNamespace]] but instead of returning the [[Namespace]] `namespace` it returns its parent
 * namespace and the key that would lead to the `namespace` namespace.
 */
export function enterParentNamespace<T>(start: Namespace<T>, namespace: string | string[]): [Namespace<T>, string] {
    const parts = Array.isArray(namespace) ? namespace : namespace.split(".");
    const key = parts.pop() as string;
    return [enterNamespace(start, parts), key];
}

/**
 * Get the namespace described by `namespace` relative to the `start` namespace.
 */
export function enterNamespace<T>(start: Namespace<T>, namespace: string | string[]): Namespace<T> {
    let target = start;

    const parts = Array.isArray(namespace) ? namespace : namespace.split(".");

    for (const part of parts) {
        if (part == "__value")
            throw new Error(`Cannot use reserved name __value in namespace: ${namespace}`);

        if (part in target)
            target = target[part] as Namespace<T>;
        else
            target = target[part] = {};
    }

    return target;
}

/**
 * Get an object literal representing the flattened namespace.
 * The namespace is flattened by combining the keys with a period.
 *
 * @example
 * ```typescript
 *
 * const ns = {a: {
 *      b: {
 *          c: 5,
 *          d: 6
 *      },
 *      e: 7,
 *      __value: 8
 * }};
 *
 * const flat = flattenNamespace(ns);
 *
 * // true
 * flat === {
 *     "a.b.c": 5,
 *     "a.b.d": 6,
 *     "a.e": 7,
 *     "a": 8,
 * };
 * ```
 */
export function flattenNamespace<T>(ns: Namespace<T>): { [key: string]: T } {
    const result: { [key: string]: T } = {};

    const stack = [[undefined, ns]];

    while (stack.length) {
        const [prefix, target] = stack.pop() as [string | undefined, Namespace];

        for (const [key, value] of Object.entries(target))
            if (key === "__value")
                result[prefix === undefined ? "." : prefix] = value;
            else {
                const absKey = prefix === undefined ? key : [prefix, key].join(".");
                stack.push([absKey, value]);
            }
    }

    return result;
}

/**
 * Type of a [[Namespace]] using [[NamespaceTraps]] to grant easy access to its values.
 */
export interface ProxiedNamespace<VT = any> {
    [key: string]: VT;
}

/**
 * Traps passed to the Proxy for Namespace objects.
 */
export const NamespaceTraps: ProxyHandler<Namespace> = {
    get<T>(target: Namespace<T>, p: PropertyKey, receiver?: any): T {
        if (typeof p === "string")
            return Reflect.get(enterNamespace(target, p), "__value");
        else return Reflect.get(target, p, receiver);
    },
    set<T>(target: Namespace<T>, p: PropertyKey, value: T, receiver?: any): boolean {
        if (typeof p === "string")
            return Reflect.set(enterNamespace(target, p), "__value", value);
        else return Reflect.set(target, p, value, receiver);
    },
    deleteProperty(target: Namespace, p: PropertyKey): boolean {
        if (typeof p === "string")
            return Reflect.deleteProperty(enterNamespace(target, p), "__value");
        else return Reflect.deleteProperty(target, p);
    },
    has(target: Namespace, p: PropertyKey): boolean {
        if (typeof p === "string")
            return Reflect.has(enterNamespace(target, p), "__value");
        else return Reflect.has(target, p);
    },
    ownKeys(target: Namespace): PropertyKey[] {
        const keys = Reflect.ownKeys(target);
        return keys.filter(key => key !== "__value");
    }
};

/**
 * @see [[HasMemory]] for an implementation.
 */
export interface HasMemory<T extends Memory = any> {
    memory: Namespace;
    remember: (key: string, value: any) => void;
    forget: (key: string, forgetNamespace?: boolean) => void;
    resetMemory: (...namespaces: string[]) => void;
}

export class Memory implements HasMemory {
    readonly memory: ProxiedNamespace;
    private readonly internalMemory: Namespace;

    constructor() {
        this.internalMemory = {};
        this.memory = new Proxy(this.internalMemory, NamespaceTraps);
    }

    remember(key: string, value: any) {
        this.memory[key] = value;
    }

    forget(key: string, forgetNamespace?: boolean) {
        let target;
        if (forgetNamespace) {
            [target, key] = enterParentNamespace(this.internalMemory, key);
        } else target = this.memory;

        delete target[key];
    }

    resetMemory(...namespaces: string[]) {
        namespaces = namespaces.length > 0 ? namespaces : Object.keys(this.memory);

        namespaces.forEach(ns => {
            this.forget(ns, true);
        });
    }
}

/**
 * @see [[ElementMemory]] for an implementation.
 */
export interface HasElementMemory<T extends ElementMemory = any> {
    injected: (el: Element, ns: string) => void;
    removeInjected: (...namespaces: string[]) => void;
}

/**
 * [[Memory]] that can also keep track of injected DOM elements.
 */
export class ElementMemory extends Memory implements HasElementMemory {
    private readonly internalInjectedMemory: Namespace<Node[]>;
    private readonly injectedMemory: ProxiedNamespace<Node[]>;

    constructor() {
        super();
        this.internalInjectedMemory = {};
        // @ts-ignore
        this.injectedMemory = new Proxy(this.internalInjectedMemory, NamespaceTraps) as ProxiedNamespace<Element[]>;
    }


    /** Keep track of the given element such that it can be removed later. */
    injected(el: Node, ns?: string) {
        ns = ns || "global";
        const elements = this.injectedMemory[ns];

        if (elements) elements.push(el);
        else this.injectedMemory[ns] = [el];
    }

    /**
     * Remove all elements from the given namespaces.
     * If no namespaces provided removes all elements.
     */
    removeInjected(...namespaces: string[]) {
        namespaces = namespaces.length > 0 ? namespaces : Object.keys(this.injectedMemory);

        namespaces.forEach(key => {
            const [parentNS, nsKey] = enterParentNamespace(this.internalInjectedMemory, key);

            const flattened = flattenNamespace(parentNS[nsKey] as Namespace);
            Object.values(flattened).forEach(elements => elements.forEach((el: Element) => el.remove()));

            delete parentNS[nsKey];
        });
    }
}

/**
 * Decorator to cache the result of a nullary method.
 */
export function cacheInMemory(name?: string) {
    return function (target: Object & HasMemory, propertyKey: string, descriptor: PropertyDescriptor) {
        const keyName: string = name || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;
        let returnPromise: boolean;

        descriptor.value = function () {
            const memory = this.memory;

            let value;
            if (keyName in memory) {
                value = memory[keyName];
            } else {
                value = func.apply(this);
                returnPromise = !!value.then;

                Promise.resolve(value)
                    .then(val => this.remember(keyName, val))
                    .catch(console.error);
            }

            if (returnPromise) return Promise.resolve(value);
            else return value;
        };
    };
}