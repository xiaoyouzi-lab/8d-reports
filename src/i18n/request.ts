import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  let locale = 'en';

  if (typeof globalThis !== 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
      if (cookieLocale === 'en' || cookieLocale === 'zh-CN') {
        locale = cookieLocale;
      }
    } catch {
      // fallback to default
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  };
});
