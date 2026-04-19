import { formatErrorMessage } from '@/utils/format'

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
   * Additional meta information about the response (optional)
   */
  meta: Meta
}

export class ServiceResponse {
  /**
   * Creates a successful service response
   */
  static success<Data extends BaseApiResultData, Meta extends BaseApiResultMeta>(data: BaseApiResult<Data, Meta>): ServiceResponseSuccess<Data, Meta> {
    return {
      success: true,
      data: data.data,
      meta: data.meta,
      message: null,
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
      message: error ? formatErrorMessage(error) : message,
      data: null,
      meta: { msg: message },
    }
  }
}
