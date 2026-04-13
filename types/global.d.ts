/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {

  interface ActionState<T = any> {
    /**
     * 操作是否成功
     */
    success?: boolean
    /**
     * 表单错误
     */
    validationErrors?: import('@react-types/shared').ValidationErrors
    /**
     * 服务错误
     */
    error?: Error | string | null
    /**
     * 返回数据
     */
    data?: T
  }

  /**
   * Represents an action function used with React's `useAction`-style hooks.
   *
   * This function receives the previous state and a FormData object,
   * and returns the next state (either synchronously or asynchronously).
   *
   * @template T - The shape of the state managed by the action.
   *
   * @param state - The previous state, or null if it has not been initialized.
   * @param formData - The FormData submitted from a form.
   * @returns The next state, null, or a Promise resolving to the next state or null.
   *
   * @example
   * ```tsx
   * type LoginState = {
   *   success: boolean;
   *   message?: string;
   * };
   *
   * const loginAction: ActionFunction<LoginState> = async (state, formData) => {
   *   const username = formData.get("username");
   *   const password = formData.get("password");
   *
   *   if (username === "admin" && password === "1234") {
   *     return { success: true };
   *   }
   *
   *   return { success: false, message: "Invalid credentials" };
   * };
   *
   * export default function LoginForm() {
   *   const [state, action] = useAction(loginAction, null);
   *
   *   return (
   *     <form action={action}>
   *       <input name="username" />
   *       <input name="password" type="password" />
   *       <button type="submit">Login</button>
   *
   *       {state?.message && <p>{state.message}</p>}
   *     </form>
   *   );
   * }
   * ```
   */
  type ActionFunction<T = any>
    = (state: ActionState<T> | null, formData: FormData) => ActionState<T> | Promise<ActionState<T> | null> | null

  type ActionFunctionPayload<T = any, U = any>
    = (payload: U, state: ActionState<T> | null, formData: FormData) => ActionState<T> | Promise<ActionState<T> | null>

  type KeyOfStringOrNumber<T> = {
    [K in keyof T]: T[K] extends string | number ? K : never
  }[keyof T]

  interface Pagination<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }

  type PaginationParams<T> = {
    pageSize?: number
    page?: number
    direction?: string
    column?: string
  } & Partial<T>

  type RequireKeys<
    T,
    K extends keyof T = never,
  > = Partial<T> & Required<Pick<T, K>>

  type EntityDTO<T> = {
    [K in keyof T]: T[K];
  }
}

export {}
