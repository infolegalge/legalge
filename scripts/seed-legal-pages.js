const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLegalPages() {
  try {
    console.log('🌱 Seeding legal pages...');

    // Create Terms of Service page
    const termsPage = await prisma.legalPage.upsert({
      where: { slug: 'terms' },
      update: {},
      create: {
        slug: 'terms',
        title: 'Terms of Service',
        content: `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using Legal Sandbox Georgia ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

Legal Sandbox Georgia provides a platform for connecting clients with legal specialists and companies offering legal services in Georgia. We facilitate the connection but do not provide legal advice directly.

## 3. User Responsibilities

As a user of our service, you agree to:
- Provide accurate and complete information
- Use the service only for lawful purposes
- Respect the rights and privacy of other users
- Not engage in fraudulent or deceptive practices
- Comply with all applicable laws and regulations

## 4. Legal Services Disclaimer

Legal Sandbox Georgia is a platform that connects clients with legal service providers. We do not provide legal advice, and any legal services are provided by independent legal professionals or companies.

## 5. Limitation of Liability

Legal Sandbox Georgia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

## 6. Intellectual Property

The service and its original content, features, and functionality are and will remain the exclusive property of Legal Sandbox Georgia and its licensors.

## 7. Termination

We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.

## 8. Governing Law

These Terms shall be interpreted and governed by the laws of Georgia, without regard to its conflict of law provisions.

## 9. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.

## 10. Contact Information

If you have any questions about these Terms of Service, please contact us at:
Email: legal@legalsandbox.ge
Address: Tbilisi, Georgia`,
        lastUpdated: new Date(),
        translations: {
          create: [
            {
              locale: 'ka',
              title: 'მომსახურების წესები',
              slug: 'terms',
              content: `# მომსახურების წესები

ბოლო განახლება: ${new Date().toLocaleDateString()}

## 1. წესების მიღება

Legal Sandbox Georgia-ს ("მომსახურება") გამოყენებით, თქვენ მიიღებთ და ეთანხმებით ამ შეთანხმების პირობებს.

## 2. მომსახურების აღწერა

Legal Sandbox Georgia უზრუნველყოფს პლატფორმას კლიენტებისა და იურიდიული სერვისების მიმწოდებლების დასაკავშირებლად საქართველოში. ჩვენ ვხელს ვუწყობთ კავშირს, მაგრამ პირდაპირ იურიდიულ რჩევას არ ვაწვდით.`,
              metaTitle: 'მომსახურების წესები - Legal Sandbox Georgia',
              metaDescription: 'Legal Sandbox Georgia-ს მომსახურების წესები და პირობები'
            },
            {
              locale: 'en',
              title: 'Terms of Service',
              slug: 'terms',
              content: `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using Legal Sandbox Georgia ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

Legal Sandbox Georgia provides a platform for connecting clients with legal specialists and companies offering legal services in Georgia. We facilitate the connection but do not provide legal advice directly.`,
              metaTitle: 'Terms of Service - Legal Sandbox Georgia',
              metaDescription: 'Terms of Service for Legal Sandbox Georgia platform'
            },
            {
              locale: 'ru',
              title: 'Условия использования',
              slug: 'terms',
              content: `# Условия использования

Последнее обновление: ${new Date().toLocaleDateString()}

## 1. Принятие условий

Используя Legal Sandbox Georgia ("Сервис"), вы принимаете и соглашаетесь соблюдать условия данного соглашения.

## 2. Описание сервиса

Legal Sandbox Georgia предоставляет платформу для связи клиентов с юридическими специалистами и компаниями, предлагающими юридические услуги в Грузии. Мы способствуем установлению связей, но не предоставляем прямые юридические консультации.`,
              metaTitle: 'Условия использования - Legal Sandbox Georgia',
              metaDescription: 'Условия использования платформы Legal Sandbox Georgia'
            }
          ]
        }
      }
    });

    // Create Privacy Policy page
    const privacyPage = await prisma.legalPage.upsert({
      where: { slug: 'privacy' },
      update: {},
      create: {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## 1. Information We Collect

We collect information you provide directly to us, such as when you create an account, submit a request, or contact us for support.

- Name and contact information
- Email address
- Phone number
- Company information (if applicable)
- Legal service requests and communications

## 2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process and respond to your legal service requests
- Communicate with you about our services
- Send you technical notices and support messages
- Comply with legal obligations

## 3. Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

## 4. Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 5. Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your personal information
- Object to processing of your information
- Data portability

## 6. Contact Us

If you have any questions about this Privacy Policy, please contact us at:
Email: privacy@legalsandbox.ge
Address: Tbilisi, Georgia`,
        lastUpdated: new Date(),
        translations: {
          create: [
            {
              locale: 'ka',
              title: 'კონფიდენციალურობის პოლიტიკა',
              slug: 'privacy',
              content: `# კონფიდენციალურობის პოლიტიკა

ბოლო განახლება: ${new Date().toLocaleDateString()}

## 1. ინფორმაცია, რომელსაც ვაგროვებთ

ჩვენ ვაგროვებთ ინფორმაციას, რომელსაც პირდაპირ გვაწვდით, მაგალითად, როცა ანგარიშს ქმნით, მოთხოვნას წარადგენთ ან დახმარებისთვის დაგვიკავშირდებით.

- სახელი და კონტაქტური ინფორმაცია
- ელექტრონული ფოსტის მისამართი
- ტელეფონის ნომერი
- კომპანიის ინფორმაცია (თუ გამოიყენება)
- იურიდიული სერვისების მოთხოვნები და კომუნიკაციები`,
              metaTitle: 'კონფიდენციალურობის პოლიტიკა - Legal Sandbox Georgia',
              metaDescription: 'Legal Sandbox Georgia-ს კონფიდენციალურობის პოლიტიკა და მონაცემთა დაცვა'
            },
            {
              locale: 'en',
              title: 'Privacy Policy',
              slug: 'privacy',
              content: `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## 1. Information We Collect

We collect information you provide directly to us, such as when you create an account, submit a request, or contact us for support.

- Name and contact information
- Email address
- Phone number
- Company information (if applicable)
- Legal service requests and communications`,
              metaTitle: 'Privacy Policy - Legal Sandbox Georgia',
              metaDescription: 'Privacy Policy for Legal Sandbox Georgia platform'
            },
            {
              locale: 'ru',
              title: 'Политика конфиденциальности',
              slug: 'privacy',
              content: `# Политика конфиденциальности

Последнее обновление: ${new Date().toLocaleDateString()}

## 1. Информация, которую мы собираем

Мы собираем информацию, которую вы предоставляете нам напрямую, например, когда вы создаете аккаунт, подаете запрос или обращаетесь к нам за поддержкой.

- Имя и контактная информация
- Адрес электронной почты
- Номер телефона
- Информация о компании (если применимо)
- Запросы на юридические услуги и сообщения`,
              metaTitle: 'Политика конфиденциальности - Legal Sandbox Georgia',
              metaDescription: 'Политика конфиденциальности платформы Legal Sandbox Georgia'
            }
          ]
        }
      }
    });

    console.log('✅ Legal pages seeded successfully!');
    console.log('📄 Terms page:', termsPage.slug);
    console.log('🔒 Privacy page:', privacyPage.slug);

  } catch (error) {
    console.error('❌ Error seeding legal pages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLegalPages();
