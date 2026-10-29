import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';
import { APP_VERSION, LEGAL } from '../../config';
import { useStore } from '../../data/AppStore';
import { exportFileName, pickJson, saveJson } from '../../data/files';
import { normalizeImport } from '../../data/schema';
import { MAX_GOAL } from '../../game/rules';
import type { AppData, Language, Settings, ThemePref } from '../../game/types';
import { SEP } from '../../i18n/format';
import { ensurePermission, remindersSupported } from '../../notifications';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../../ui/Icon';
import { SheetHead, useSheet, useToast } from '../../ui/overlays';
import { Button, Card, Field, IconButton, Segmented, Stepper, Switch } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { Input } from '../todos/sheets';

/** "07:30" ± minutes, wrapping around midnight. */
export function shiftTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <T v="eyebrow" muted accessibilityRole="header">
        {title}
      </T>
      {children}
    </View>
  );
}

export function TimeRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  return (
    <Card pad={12}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <T v="bold">{label}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconButton icon="minus" label={t('common.less')} size={32} color={c.ink} onPress={() => onChange(shiftTime(value, -30))} />
          <T v="monoBold" style={{ minWidth: 52, textAlign: 'center', fontSize: 15 }}>
            {value}
          </T>
          <IconButton icon="plus" label={t('common.more')} size={32} color={c.ink} onPress={() => onChange(shiftTime(value, 30))} />
        </View>
      </View>
    </Card>
  );
}

function LinkRow({ label, url, last }: { label: string; url: string; last?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14 },
        !last && { borderBottomWidth: 1, borderBottomColor: c.line },
        pressed && { opacity: 0.6 },
      ]}
    >
      <T>{label}</T>
      <Icon name="right" size={18} color={c.muted} />
    </Pressable>
  );
}

export function SettingsSheet({ close }: { close: () => void }) {
  const { t, i18n } = useTranslation();
  const { c } = useTheme();
  const { settings, today, mindfulGoal, actions } = useStore();
  const toast = useToast();
  const sheet = useSheet();
  const [name, setName] = useState(settings.name);
  const [paste, setPaste] = useState('');
  const push = settings.push ?? { enabled: false };
  const legal = i18n.language === 'de' ? LEGAL.de : LEGAL.en;

  const saveName = () => {
    const n = name.trim().slice(0, 40);
    if (n !== settings.name) actions.saveSettings({ name: n });
  };

  const setPush = (patch: Partial<NonNullable<Settings['push']>>) => actions.saveSettings({ push: { ...push, ...patch } });

  /** Turning a reminder on asks for permission right here, from the tap. */
  const toggleReminder = async (key: 'enabled' | 'evening' | 'mindful') => {
    const on = !push[key];
    if (on && !(await ensurePermission())) {
      toast(t('settings.permissionDenied'), 'warn');
      return;
    }
    setPush({ [key]: on });
  };

  const doExport = async () => {
    try {
      await saveJson(exportFileName(today), JSON.stringify(actions.exportData(), null, 2));
      toast(t('toast.exported'));
    } catch {
      toast(t('toast.saveError'), 'warn');
    }
  };

  const askImport = (text: string) => {
    let parsed: AppData;
    try {
      parsed = normalizeImport(text);
    } catch {
      toast(t('toast.importError'), 'warn');
      return;
    }
    sheet.open(
      (cl) => (
        <View>
          <SheetHead title={t('settings.importTitle')} onClose={cl} />
          <View style={{ gap: 8, marginBottom: 16 }}>
            <T muted>{t('settings.importText')}</T>
            <T muted>
              {t('settings.importText2', {
                todos: Object.keys(parsed.todos).length,
                routines: Object.keys(parsed.routines).length,
                days: Object.keys(parsed.days).length,
              })}
            </T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button kind="ghost" label={t('common.cancel')} onPress={cl} style={{ flexGrow: 1, flexBasis: 140 }} />
            <Button
              label={t('settings.importConfirm')}
              style={{ flexGrow: 1, flexBasis: 140 }}
              onPress={async () => {
                try {
                  await actions.importData(parsed);
                  toast(t('toast.imported'));
                } catch {
                  toast(t('toast.saveError'), 'warn');
                }
                cl();
              }}
            />
          </View>
        </View>
      ),
      t('settings.importTitle'),
    );
  };

  const doPick = async () => {
    try {
      const text = await pickJson();
      if (text != null) askImport(text);
    } catch {
      toast(t('toast.importError'), 'warn');
    }
  };

  const askDeleteAll = () =>
    sheet.open(
      (cl) => (
        <View>
          <SheetHead title={t('settings.deleteAllTitle')} onClose={cl} />
          <T muted style={{ marginBottom: 16 }}>
            {t('settings.deleteAllText')}
          </T>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button kind="ghost" label={t('common.keep')} onPress={cl} style={{ flexGrow: 1, flexBasis: 140 }} />
            <Button
              kind="danger"
              label={t('settings.deleteAll')}
              style={{ flexGrow: 1, flexBasis: 140 }}
              onPress={async () => {
                try {
                  await actions.resetAll();
                  toast(t('toast.deletedAll'));
                } catch {
                  toast(t('toast.saveError'), 'warn');
                }
                cl();
              }}
            />
          </View>
        </View>
      ),
      t('settings.deleteAllTitle'),
    );

  return (
    <View>
      <SheetHead
        title={t('settings.title')}
        onClose={() => {
          saveName();
          close();
        }}
      />
      <View style={{ gap: 24 }}>
        <Section title={t('settings.profile')}>
          <Field label={t('settings.name')}>
            <Input value={name} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} maxLength={40} placeholder={t('settings.namePlaceholder')} autoComplete="given-name" accessibilityLabel={t('settings.name')} />
          </Field>
          <Field label={t('settings.language')}>
            <Segmented<Language>
              label={t('settings.language')}
              value={settings.language}
              onChange={(v) => actions.saveSettings({ language: v })}
              options={[
                { key: 'system', label: t('settings.langSystem') },
                { key: 'de', label: t('settings.langDe') },
                { key: 'en', label: t('settings.langEn') },
              ]}
            />
          </Field>
          <Field label={t('settings.theme')}>
            <Segmented<ThemePref>
              label={t('settings.theme')}
              value={settings.theme ?? 'system'}
              onChange={(v) => actions.saveSettings({ theme: v })}
              options={[
                { key: 'system', label: t('settings.themeSystem') },
                { key: 'light', label: t('settings.themeLight') },
                { key: 'dark', label: t('settings.themeDark') },
              ]}
            />
          </Field>
        </Section>

        <Section title={t('settings.game')}>
          <Card pad={12}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexShrink: 1 }}>
                <T v="bold">{t('settings.goal')}</T>
                <T v="small" muted>
                  {t('settings.goalValue', { count: settings.dailyGoal })}
                </T>
              </View>
              <Stepper value={settings.dailyGoal} max={MAX_GOAL} onChange={actions.setGoal} decLabel={t('common.less')} incLabel={t('common.more')} />
            </View>
          </Card>
          <Card pad={12}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexShrink: 1 }}>
                <T v="bold">{t('settings.mindfulGoal')}</T>
                <T v="small" muted>
                  {t('settings.mindfulGoalValue', { count: mindfulGoal })}
                </T>
              </View>
              <Stepper value={mindfulGoal} min={1} max={120} onChange={(v) => actions.saveSettings({ mindfulGoal: v })} decLabel={t('common.less')} incLabel={t('common.more')} />
            </View>
          </Card>
        </Section>

        <Section title={t('settings.reminders')}>
          {remindersSupported ? (
            <View style={{ gap: 8 }}>
              <Switch on={!!push.enabled} onToggle={() => toggleReminder('enabled')} title={t('settings.morningReminder')} text={t('settings.morningText')} />
              {push.enabled ? <TimeRow label={t('settings.time')} value={push.time || '07:30'} onChange={(time) => setPush({ time })} /> : null}
              <Switch on={!!push.evening} onToggle={() => toggleReminder('evening')} title={t('settings.eveningReminder')} text={t('settings.eveningText')} />
              {push.evening ? <TimeRow label={t('settings.time')} value={push.eveningTime || '20:00'} onChange={(eveningTime) => setPush({ eveningTime })} /> : null}
              <Switch on={!!push.mindful} onToggle={() => toggleReminder('mindful')} title={t('settings.mindfulReminder')} text={t('settings.mindfulReminderText')} />
              {push.mindful ? <TimeRow label={t('settings.time')} value={push.mindfulTime || '12:30'} onChange={(mindfulTime) => setPush({ mindfulTime })} /> : null}
            </View>
          ) : (
            <T v="small" muted>
              {t('settings.remindersWeb')}
            </T>
          )}
        </Section>

        <Section title={t('settings.data')}>
          <T v="small" muted>
            {t('settings.localNote')}
          </T>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button kind="ghost" small icon="download" label={t('settings.export')} onPress={doExport} style={{ flexGrow: 1, flexBasis: 140 }} />
            <Button kind="ghost" small icon="upload" label={t('settings.import')} onPress={doPick} style={{ flexGrow: 1, flexBasis: 140 }} />
          </View>
          <Input
            value={paste}
            onChangeText={setPaste}
            multiline
            placeholder={t('settings.pastePlaceholder')}
            accessibilityLabel={t('settings.pastePlaceholder')}
            style={{ height: 84, paddingTop: 12, textAlignVertical: 'top', fontSize: 14 }}
          />
          {paste.trim() ? <Button small kind="ghost" label={t('settings.check')} onPress={() => askImport(paste)} style={{ alignSelf: 'flex-start' }} /> : null}
          <Button small kind="dangerGhost" icon="trash" label={t('settings.deleteAll')} onPress={askDeleteAll} style={{ alignSelf: 'flex-start' }} />
        </Section>

        <Section title={t('settings.legal')}>
          <View style={{ borderRadius: 13, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' }}>
            <LinkRow label={t('settings.privacy')} url={legal.privacy} />
            <LinkRow label={t('settings.terms')} url={legal.terms} />
            <LinkRow label={t('settings.imprint')} url={legal.imprint} />
            <LinkRow label={t('settings.support')} url={legal.support} last />
          </View>
          <T v="tiny" muted style={{ textAlign: 'center', marginTop: 4 }}>
            {t('app.name')}
            {SEP}
            {t('settings.version', { version: APP_VERSION })}
          </T>
        </Section>
      </View>
    </View>
  );
}
