import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { ensurePermission, remindersSupported } from '../../notifications';
import { useTheme } from '../../theme/ThemeProvider';
import { Logo } from '../../ui/graphics';
import { Icon, type IconName } from '../../ui/Icon';
import { useSheet } from '../../ui/overlays';
import { Button, Field, Switch } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { Input } from '../todos/sheets';

function Point({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.wPlum, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={c.plumText} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <T v="bold">{title}</T>
        <T v="small" muted>
          {text}
        </T>
      </View>
    </View>
  );
}

function WelcomeSheet({ close }: { close: () => void }) {
  const { t } = useTranslation();
  const { settings, actions } = useStore();
  const [name, setName] = useState('');
  const [remind, setRemind] = useState(false);

  const start = () => {
    actions.saveSettings({
      name: name.trim().slice(0, 40),
      onboarded: true,
      push: { ...(settings.push ?? { enabled: false }), enabled: remind },
    });
    close();
  };

  return (
    <View style={{ gap: 20, paddingTop: 6 }}>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Logo label={t('app.name')} scale={1.3} />
      </View>
      <View style={{ gap: 6 }}>
        <T v="h1" accessibilityRole="header">
          {t('welcome.title')}
        </T>
        <T muted>{t('welcome.text')}</T>
      </View>
      <View style={{ gap: 14 }}>
        <Point icon="check" title={t('welcome.p1')} text={t('welcome.p1Text')} />
        <Point icon="flame" title={t('welcome.p2')} text={t('welcome.p2Text')} />
        <Point icon="lotus" title={t('welcome.p4')} text={t('welcome.p4Text')} />
        <Point icon="trophy" title={t('welcome.p3')} text={t('welcome.p3Text')} />
      </View>
      <Field label={t('settings.name')}>
        <Input value={name} onChangeText={setName} maxLength={40} placeholder={t('settings.namePlaceholder')} autoComplete="given-name" accessibilityLabel={t('settings.name')} returnKeyType="done" onSubmitEditing={start} />
      </Field>
      {remindersSupported ? (
        <Switch
          on={remind}
          onToggle={async () => setRemind(!remind && (await ensurePermission()))}
          title={t('welcome.remind')}
          text={t('settings.morningText')}
        />
      ) : null}
      <Button label={t('welcome.start')} onPress={start} />
    </View>
  );
}

/**
 * Shows the welcome screen once on a fresh install. People who already have data
 * (imported or from before this screen existed) skip it silently.
 */
export function WelcomeGate() {
  const { t } = useTranslation();
  const { ready, data, settings, actions } = useStore();
  const sheet = useSheet();
  const shown = useRef(false);
  useEffect(() => {
    if (!ready || settings.onboarded || shown.current) return;
    shown.current = true;
    const hasData = Object.keys(data.todos).length > 0 || Object.keys(data.routines).length > 0;
    // Counts as seen once shown, even if dismissed by tapping outside.
    actions.saveSettings({ onboarded: true });
    if (!hasData) sheet.open((close) => <WelcomeSheet close={close} />, t('welcome.title'));
  }, [ready, settings.onboarded, data, actions, sheet, t]);
  useEffect(() => {
    // Re-arm once onboarded, so "delete all data" brings the welcome screen back.
    if (settings.onboarded) shown.current = false;
  }, [settings.onboarded]);
  return null;
}
