import { FormattedResult } from './types';
import request = require('../../../../lib/request');
import config = require('../../../../lib/config');
import { api as getApiToken } from '../../../../lib/api-token';
import { CustomError } from '../../../../lib/errors';

export async function trackUsage(
  formattedResults: FormattedResult[],
): Promise<void> {
  const trackingData = formattedResults.map((res) => {
    return {
      isPrivate: res.meta.isPrivate,
      issuesPrevented: res.result.cloudConfigResults.length,
    };
  });
  const trackingResponse = await request({
    method: 'POST',
    headers: {
      Authorization: `token ${getApiToken()}`,
    },
    url: `${config.API}/track-iac-usage/cli`,
    body: { results: trackingData },
    gzip: true,
    json: true,
  });
  switch (trackingResponse.res.statusCode) {
    case 200:
      // carry on
      break;
    case 429:
      throw new TestLimitReachedError();
    default:
      throw new CustomError(
        'An error occurred while attempting to track test usage: ' +
          JSON.stringify(trackingResponse.res.body),
      );
  }
}

export class TestLimitReachedError extends CustomError {
  constructor() {
    super(
      'Test limit reached! You have exceeded your infrastructure as code test allocation for this billing period.',
    );
  }
}
