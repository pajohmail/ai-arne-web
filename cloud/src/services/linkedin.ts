/**
 * Service för LinkedIn API-integration
 * 
 * Denna modul hanterar publicering av inlägg till LinkedIn Business Page
 * via LinkedIn UGC (User Generated Content) API.
 * 
 * @module linkedin
 */

import axios from 'axios';

/**
 * Argument för att publicera på LinkedIn
 */
type LinkedInPostArgs = {
  /** LinkedIn organization URN (t.ex. "urn:li:organization:123456") */
  organizationUrn: string;
  /** Inläggstext */
  text: string;
  /** Valfri titel för artikel-länk */
  title?: string;
  /** Valfri länk att bifoga som artikel */
  link?: string;
};

/**
 * Publicerar ett inlägg på LinkedIn Business Page
 * 
 * Funktionen skapar ett UGC-post via LinkedIn API och publicerar det
 * på den angivna organisationens sida.
 * 
 * @param args - Inläggsargument
 * @param accessToken - LinkedIn access token (default: från miljövariabel)
 * @returns Promise som resolverar till API-responsen
 * @throws Error om API-anropet misslyckas
 * 
 * @example
 * await postToLinkedIn({
 *   organizationUrn: 'urn:li:organization:123456',
 *   text: 'AI-nyheter denna vecka...',
 *   title: 'AI-nyheter',
 *   link: 'https://ai-arne.se/news'
 * });
 */
export async function postToLinkedIn(args: LinkedInPostArgs, accessToken = process.env.LINKEDIN_ACCESS_TOKEN!) {
  const { organizationUrn, text, title, link } = args;

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

  const { data } = await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });

  return data;
}
