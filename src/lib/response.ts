import { formatErrorMessage } from '@/utils/format'
import { RequestError } from '@/utils/request'

export interface ServiceResponseSuccess<T, Meta extends BaseApiResultMeta> {
  /**
   * Indicates a successful operation
   */
  success: true
  /**
   * The returned response data
   */
  data: T
  /**
   * Error message (always null on success)
   */
  message: null
  /**
   * status 状态码
   */
  status: null
  /**
   * Additional meta information about the response (optional)
   */
  meta: Meta & BaseApiResultMetaWithMsg
}

export interface ServiceResponseError<Meta extends BaseApiResultMetaWithMsg = BaseApiResultMetaWithMsg> {
  /**
   * Indicates a failed operation
   */
  success: false
  /**
   * The returned data (typically null on failure)
   */
  data: null
  /**
   * Description of the error
   */
  message: string
  /**
   * status 状态码
   */
  status: number | null
  /**
   * Additional meta information about the response (optional)
   */
  meta: Meta
}


export class ServiceResponse {
  /**
   * Creates a successful service response
   */
  static success<Data extends BaseApiResultData, Meta extends BaseApiResultMeta>(
    result: BaseApiResult<Data, Meta>,
  ): ServiceResponseSuccess<Data, Meta> {
    return {
      success: true,
      data: result.data,
      message: null,
      status: null,
      meta: result.meta,
    }
  }

  /**
   * Creates an error service response
   */
  static error(
    message: string,
    error?: unknown,
  ): ServiceResponseError {
    return {
      success: false,
      data: null,
      message: error ? formatErrorMessage(error) : message,
      status: error instanceof RequestError ? error.status : null,
      meta: { msg: message },
    }
  }
}
