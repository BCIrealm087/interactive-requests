import { signal, Signal, ReadonlySignal, computed } from "@preact/signals-react";

export type OptionalGetter<Type> = Type extends OptionalSignal<infer ValueType> ? ()=>ValueType|null : never;
export type OptionalSetter<Type> = Type extends OptionalSignal<infer ValueType> ? (value: ValueType|null)=>void : never;

export type ControllerBase = {
  state: object
};

type StatePicker<State, Keys extends keyof State | null> = { 
  [P in Keys as (P extends null ? never : P)]: 
    (P extends keyof State 
      ? State[P] 
      : never
    ) 
}

type PropsPicker<Props, Keys extends keyof Props | null> = { 
  [P in Keys as (P extends null ? never : P)]: 
    (P extends keyof Props ? Props[P] : never) 
};

export namespace Filter {
  export type State<
    Controller extends ControllerBase, 
    Keys extends keyof Controller['state'] | null
  > = Omit<Controller, 'state'> & { 
    state: StatePicker<Controller['state'], Keys>
  };

  export type Props<
    Controller extends ControllerBase, 
    Keys extends keyof Omit<Controller, 'state'> | null
  > = { state: Controller['state'] } 
    & PropsPicker<Omit<Controller, 'state'>, Keys>;

  export type All<
    Controller extends ControllerBase, 
    StateKeys extends keyof Controller['state'] | null, 
    PropKeys extends keyof Omit<Controller, 'state'> | null = null
  > = { 
        state: StatePicker<Controller['state'], StateKeys> 
      } 
    & PropsPicker<Omit<Controller, 'state'>, PropKeys>;
}

export class OptionalSignal<ValueType> {
  private enabledState: Signal<{
    isEnabled: true, 
    active: boolean
  } | { 
    isEnabled: false
  }>;
  private innerValue: Signal<ValueType|null>;
  private _value: ReadonlySignal<ValueType|null>;
  private persistent: boolean;

  getter: OptionalGetter<OptionalSignal<ValueType>>;
  setter: OptionalSetter<OptionalSignal<ValueType>>;

  constructor(initialValue: ValueType|null = null, persistent = false) {
    this.enabledState = signal((persistent || initialValue!==null) 
      ? { isEnabled: true, active: false } 
      : { isEnabled: false });
    this.innerValue = signal(initialValue);
    this.persistent = persistent;
    this._value = computed(()=>{
      const enabledState = this.enabledState.value;
      return (enabledState.isEnabled && enabledState.active)
        ? this.innerValue.value
        : null;
    });

    this.getter = ()=>this._value.value;
    this.setter = (value: ValueType|null)=>this.value = value;
  }

  get enabled() {
    return this.enabledState.value.isEnabled;
  }

  set enabled(value: boolean) {
    this.enabledState.value = (value)
      ? {
          isEnabled: true, 
          active: false
        }
      : { isEnabled: false }
  }

  set active(value: boolean) {
    this.enabledState.value = {
      isEnabled: true, 
      active: value
    }
  }

  get active() {
    const enabledState = this.enabledState.value;
    return enabledState.isEnabled && enabledState.active;
  }

  get value() {
    return (!this.persistent) ? this._value.value : this.innerValue.value;
  }

  set value(value: ValueType|null) {
    this.innerValue.value = value;
  }
}