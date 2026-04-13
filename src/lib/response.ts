import { formatErrorMessage } from '@/utils/format'

export interface ServiceResponseSuccess<T> {
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
}

export interface ServiceResponseError {
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
}

export class ServiceResponse {
  /**
   * Creates a successful service response
   */
  static success<T>(data: T): ServiceResponseSuccess<T> {
    return {
      success: true,
      data,
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
    }
  }
}
