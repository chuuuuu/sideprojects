import React, { useReducer } from "react";

enum ACTION {
  Increment = 1,
  Decrement = 2,
}

type Config = {
  type: ACTION;
};

const reducer = (state: number, config: Config): number => {
  switch (config.type) {
    case ACTION.Increment:
      return state + 1;

    case ACTION.Decrement:
      return state - 1;

    default:
      return state;
  }
};

// you can use useMemo only when you feeling slowly
export const Example1: React.FC = () => {
  const [count, dispatch] = useReducer(reducer, 0);

  return (
    <div>
      <div>count: {count}</div>
      <button onClick={() => dispatch({ type: ACTION.Increment })}>+</button>
      <button onClick={() => dispatch({ type: ACTION.Decrement })}>-</button>
    </div>
  );
};
