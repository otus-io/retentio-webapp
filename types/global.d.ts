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

  /**
   * An extended version of ActionFunction that supports an extra payload argument.
   *
   * This is useful for actions that require additional parameters beyond form data,
   * such as IDs for update/delete operations. Typically, the payload is pre-bound
   * using `Function.bind`.
   *
   * @template Payload - The type of the extra argument passed into the action.
   * @template State - The shape of the state managed by the action.
   *
   * @param payload - The extra argument (e.g., an id), usually pre-bound via `bind`.
   * @param state - The previous state, or null if it has not been initialized.
   * @param formData - The FormData submitted from a form.
   * @returns The next state, null, or a Promise resolving to the next state or null.
   *
   * @example
   * ```tsx
   * type TodoState = {
   *   success: boolean;
   *   message?: string;
   * };
   *
   * // Action with payload (e.g., updating a todo by id)
   * const updateTodo: ActionFunctionPayload<number, TodoState> = async (
   *   id,
   *   state,
   *   formData
   * ) => {
   *   const title = formData.get("title");
   *
   *   // pretend API call
   *   await fetch(`/api/todos/${id}`, {
   *     method: "PUT",
   *     body: JSON.stringify({ title }),
   *   });
   *
   *   return { success: true };
   * };
   *
   * export default function TodoItem({ id }: { id: number }) {
   *   // bind payload (id) to the action
   *   const action = updateTodo.bind(null, id);
   *   const [state, formAction] = useAction(action, null);
   *
   *   return (
   *     <form action={formAction}>
   *       <input name="title" />
   *       <button type="submit">Update</button>
   *     </form>
   *   );
   * }
   * ```
   */
  type ActionFunctionPayload<Payload = any, State = any>
    = (payload: Payload, state: ActionState<State> | null, formData: FormData) => ActionState<State> | Promise<ActionState<State> | null>

  /**
   * Base type constraint for API response data.
   *
   * This ensures that the `data` field in the API response
   * is always an object-like structure.
   */
  type BaseApiResultData = object

  /**
   * Default meta information returned by the API.
   */
  interface BaseApiResultMeta {
    /**
     * success message
     */
    msg: string
  }

  /**
   * Generic API response structure.
   *
   * This provides a consistent shape for all API responses,
   * including both the actual data and additional metadata.
   *
   * @template Data - The type of the response data.
   * @template Meta - The type of the meta information (defaults to BaseApiResultMeta).
   *
   * @example
   * ```ts
   * interface User {
   *   id: number
   *   name: string
   * }
   *
   * type UserResponse = BaseApiResult<User>
   *
   * // Example response:
   * const res: UserResponse = {
   *   data: { id: 1, name: "Alice" },
   *   meta: { msg: "ok" }
   * }
   * ```
   */
  interface BaseApiResult<
    Data extends BaseApiResultData,
    Meta extends BaseApiResultMeta = BaseApiResultMeta,
  > {
    /**
     * The actual response data.
     */
    data: Data

    /**
     * Additional meta information about the response.
     */
    meta: Meta
  }

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
