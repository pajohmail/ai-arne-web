import axios from 'axios';

type LinkedInPostArgs = {
  organizationUrn: string;
  text: string;
  title?: string;
  link?: string;
};

/**
 * Validerar LinkedIn credentials och returnerar status
 */
export function validateLinkedInCredentials(): {
  isValid: boolean;
  token?: string;
  urn?: string;
  issues: string[]
} {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const urn = process.env.LINKEDIN_ORG_URN;
  const issues: string[] = [];

  if (!token) {
    issues.push('LINKEDIN_ACCESS_TOKEN saknas');
  } else if (token === 'placeholder') {
    issues.push('LINKEDIN_ACCESS_TOKEN är satt till "placeholder" - sätt ett riktigt token');
  } else if (token.length < 20) {
    issues.push('LINKEDIN_ACCESS_TOKEN verkar vara för kort (förväntar sig minst 20 tecken)');
  }

  if (!urn) {
    issues.push('LINKEDIN_ORG_URN saknas');
  } else if (urn === 'urn:li:organization:0') {
    issues.push('LINKEDIN_ORG_URN är satt till placeholder "urn:li:organization:0"');
  } else if (urn.includes('123456789')) {
    issues.push('LINKEDIN_ORG_URN innehåller placeholder "123456789"');
  } else if (!urn.startsWith('urn:li:organization:')) {
    issues.push('LINKEDIN_ORG_URN har fel format (ska börja med "urn:li:organization:")');
  }

  return {
    isValid: issues.length === 0,
    token,
    urn,
    issues
  };
}

/**
 * Postar till LinkedIn om credentials är konfigurerade
 * Kastar fel om credentials är ogiltiga eller API-anropet misslyckas
 */
export async function postToLinkedIn(args: LinkedInPostArgs, accessToken = process.env.LINKEDIN_ACCESS_TOKEN!) {
  const { organizationUrn, text, title, link } = args;

  // Validera att vi har credentials
  if (!accessToken) {
    throw new Error('LinkedIn access token saknas');
  }

  if (!organizationUrn) {
    throw new Error('LinkedIn organization URN saknas');
  }

  console.log(`📤 Posting to LinkedIn: ${title || 'No title'}`);
  console.log(`   Organization: ${organizationUrn}`);
  console.log(`   Link: ${link || 'No link'}`);

  const payload = {
    author: organizationUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: link ? 'ARTICLE' : 'NONE',
        media: link
          ? [
              {
                status: 'READY',
                originalUrl: link,
                title: title ? { text: title } : undefined
              }
            ]
          : undefined
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };

  try {
    const { data } = await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log(`✅ Successfully posted to LinkedIn`);
    return data;
  } catch (error: any) {
    console.error(`❌ LinkedIn API error:`, {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      message: error?.message,
      data: error?.response?.data
    });

    if (error?.response?.status === 401) {
      throw new Error('LinkedIn access token är ogiltig eller har gått ut');
    } else if (error?.response?.status === 403) {
      throw new Error('LinkedIn access token har inte behörighet att posta');
    } else if (error?.response?.status === 404) {
      throw new Error('LinkedIn organization URN är ogiltig');
    }

    throw error;
  }
}
