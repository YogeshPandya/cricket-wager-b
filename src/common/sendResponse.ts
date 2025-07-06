/**
 * Sends a response object with a message, data, and status.
 *
 * @param {string} message - The message to be sent in the response.
 * @param {any} data - The data to be sent in the response. Defaults to an empty object if not provided.
 * @param {boolean} status - The status of the response. Defaults to false if not provided.
 * @returns {Record<string, any>} - The response object containing the message, data, and status.
 */
const sendResponse = (
  message: string,
  data: any,
  status: boolean
): Record<string, any> => {
  return {
    message: message,
    data: data ? data : {},
    status: status ? status : false,
  };
};

export default sendResponse;
