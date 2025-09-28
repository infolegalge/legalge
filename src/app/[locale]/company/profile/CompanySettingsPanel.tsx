'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldBan, Bell, MailCheck } from 'lucide-react';

interface CompanySettingsPanelProps {
  locale: string;
}

type NotificationChannel = 'EMAIL' | 'IN_APP';

interface SettingsState {
  suspendSubmissions: boolean;
  autoApproveSpecialists: boolean;
  notificationEmail: string;
  notifyOnRequest: boolean;
  notifyOnPost: boolean;
  notifyChannel: NotificationChannel;
}

const defaultSettings: SettingsState = {
  suspendSubmissions: false,
  autoApproveSpecialists: false,
  notificationEmail: '',
  notifyOnRequest: true,
  notifyOnPost: true,
  notifyChannel: 'EMAIL',
};

export default function CompanySettingsPanel({ locale }: CompanySettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch('/api/company/profile/settings', { credentials: 'include' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || res.statusText);
        }
        const payload = await res.json();
        if (active && payload?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...payload.settings,
            notificationEmail: payload.settings.notificationEmail ?? prev.notificationEmail,
          }));
        }
      } catch (error) {
        if (active) {
          setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load company settings' });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const labels = useMemo(() => ({
    title: locale === 'ka' ? 'პარამეტრები' : locale === 'ru' ? 'Настройки' : 'Settings',
    description:
      locale === 'ka'
        ? 'მართე განაცხადების დამუშავება და შეტყობინებების არხები'
        : locale === 'ru'
        ? 'Управляйте обработкой заявок и каналами уведомлений'
        : 'Control submissions handling, notifications, and automation',
    suspend:
      locale === 'ka'
        ? 'დაპაუზე ახალი განაცხადები'
        : locale === 'ru'
        ? 'Приостановить новые заявки'
        : 'Suspend incoming requests',
    autoApprove:
      locale === 'ka'
        ? 'სპეციალისტების ავტომატური დამტკიცება'
        : locale === 'ru'
        ? 'Автоматическое одобрение специалистов'
        : 'Auto approve specialists',
    notifyEmail:
      locale === 'ka'
        ? 'შეტყობინების იმეილი'
        : locale === 'ru'
        ? 'Email для уведомлений'
        : 'Notification email',
    notifyChannel:
      locale === 'ka'
        ? 'შეტყობინების არხი'
        : locale === 'ru'
        ? 'Канал уведомлений'
        : 'Notification channel',
    notifyRequests:
      locale === 'ka'
        ? 'მომავალი განაცხადების შეტყობინება'
        : locale === 'ru'
        ? 'Уведомлять о новых заявках'
        : 'Notify on new requests',
    notifyPosts:
      locale === 'ka'
        ? 'პოსტების შეტყობინებები'
        : locale === 'ru'
        ? 'Уведомлять о постах'
        : 'Notify on post updates',
    save:
      locale === 'ka' ? 'შენახვა' : locale === 'ru' ? 'Сохранить' : 'Save changes',
  }), [locale]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/company/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || res.statusText);
      }
      setMessage({ type: 'success', text: locale === 'ka' ? 'პარამეტრები შენახულია' : locale === 'ru' ? 'Настройки сохранены' : 'Settings saved' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between rounded border px-4 py-3">
            <div>
              <p className="font-medium flex items-center gap-2">
                <ShieldBan className="h-4 w-4 text-amber-500" />
                {labels.suspend}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === 'ka'
                  ? 'თუ ჩართულია, ახალი სპეციალისტის მოთხოვნები ფერხდება'
                  : locale === 'ru'
                  ? 'Приостановит новые запросы на вступление от специалистов'
                  : 'Pause incoming specialist join requests'}
              </p>
            </div>
            <Switch
              checked={settings.suspendSubmissions}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, suspendSubmissions: Boolean(checked) }))}
            />
          </div>

          <div className="flex items-center justify-between rounded border px-4 py-3">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                {labels.autoApprove}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === 'ka'
                  ? 'კომპანიაში წარდგენილი სპეციალისტები ავტომატურად დაუმტკიცდებათ'
                  : locale === 'ru'
                  ? 'Специалисты будут автоматически утверждаться при заявке'
                  : 'Automatically approve specialists who request to join'}
              </p>
            </div>
            <Switch
              checked={settings.autoApproveSpecialists}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoApproveSpecialists: Boolean(checked) }))
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationEmail">{labels.notifyEmail}</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={settings.notificationEmail}
              onChange={(event) => setSettings((prev) => ({ ...prev, notificationEmail: event.target.value }))}
              placeholder="alerts@company.ge"
            />
          </div>

          <div className="space-y-2">
            <Label>{labels.notifyChannel}</Label>
            <Select
              value={settings.notifyChannel}
              onValueChange={(value) => setSettings((prev) => ({ ...prev, notifyChannel: (value as NotificationChannel) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="IN_APP">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded border px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-green-500" />
                {labels.notifyRequests}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === 'ka'
                  ? 'ახალ სპეციალისტის მოთხოვნებზე შეტყობინება'
                  : locale === 'ru'
                  ? 'Уведомления о новых заявках специалистов'
                  : 'Receive alerts when specialists request to join'}
              </p>
            </div>
            <Switch
              checked={settings.notifyOnRequest}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifyOnRequest: Boolean(checked) }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{labels.notifyPosts}</p>
              <p className="text-xs text-muted-foreground">
                {locale === 'ka'
                  ? 'შეტყობინება როდესაც პოსტი გამოქვეყნდება ან განახლდება'
                  : locale === 'ru'
                  ? 'Уведомлять при публикации или обновлении постов'
                  : 'Notify when posts are published or updated'}
              </p>
            </div>
            <Switch
              checked={settings.notifyOnPost}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifyOnPost: Boolean(checked) }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {locale === 'ka' ? 'ინახება...' : locale === 'ru' ? 'Сохранение...' : 'Saving...'}
              </>
            ) : (
              labels.save
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
