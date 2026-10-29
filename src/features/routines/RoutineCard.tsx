import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { daysLeft, hourNow } from '../../game/dates';
import { GOAL_BONUS, MAX_GOAL, ROUT_BONUS, ROUT_XP } from '../../game/rules';
import { groupBySlot, isToggleOnly, periodCount, routineReview, slotAt, targetOf, todayCount, type SlotGroupKey } from '../../game/routines';
import type { Routine } from '../../game/types';
import { SEP, shortPeriod } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/tokens';
import { Ring } from '../../ui/graphics';
import { Icon, type IconName } from '../../ui/Icon';
import { useSheet } from '../../ui/overlays';
import { Card, Chip, IconButton, LinkButton, SegBar, Stepper } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { ConfirmDelete } from '../todos/sheets';
import { RoutineForm } from './RoutineForm';

export function RoutineCard({ routine: r, mini }: { routine: Routine; mini?: boolean }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, stats, today, actions } = useStore();
  const ui = useUi();
  const sheet = useSheet();
  const target = targetOf(r);
  const count = periodCount(stats, r, today);
  const met = count >= target;
  const todayC = todayCount(data.days, r, today);
  const dl = daysLeft(r.scope, today);
  const per = t(`routines.per.${r.scope}`);
  const toggleOnly = isToggleOnly(r);
  const expanded = !mini && ui.expanded.has(r.id);

  const status = met
    ? count > target
      ? t('routines.metTimes', { count })
      : t('routines.met')
    : r.scope === 'tag'
      ? t('routines.status', { target, per, remaining: target - count })
      : t('routines.statusDays', { target, per, remaining: target - count, count: dl });

  const greenish = (a: string, b: string) => (met ? a : b);

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: met ? c.go + '73' : c.line,
        borderWidth: 1,
        borderRadius: radius.r,
        boxShadow: c.shadow,
        padding: 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: greenish(c.wGreen, c.wPlum),
          }}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          <T style={{ fontSize: 23, lineHeight: 28 }}>{r.emoji || '🎯'}</T>
        </View>
        <Pressable
          style={{ flex: 1, minWidth: 0, gap: 3 }}
          accessibilityRole="button"
          aria-expanded={mini ? undefined : expanded}
          accessibilityLabel={`${r.title}, ${status}, ${t('routines.progress', { count, target })}`}
          onPress={() => (mini ? router.navigate('/routines') : ui.toggleExpanded(r.id))}
        >
          <T v="bold">{r.title}</T>
          <T v="tiny" color={met ? c.go : c.muted} style={met && { fontFamily: fonts.bodyBold }}>
            {status}
          </T>
          <SegBar target={target} count={count} met={met} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {todayC > 0 && !toggleOnly ? <IconButton icon="minus" label={t('routines.undo')} onPress={() => actions.decRoutine(r.id)} /> : null}
          <Pressable
            onPress={() => actions.incRoutine(r.id)}
            accessibilityRole={toggleOnly ? 'checkbox' : 'button'}
            aria-checked={toggleOnly ? todayC > 0 : undefined}
            accessibilityLabel={t('routines.inc', { title: r.title, xp: ROUT_XP[r.scope] })}
            style={({ pressed }) => [
              {
                height: 44,
                minWidth: 58,
                paddingHorizontal: 12,
                borderRadius: 13,
                backgroundColor: met ? c.go : c.accent,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              },
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            {met && toggleOnly ? (
              <Icon name="check" size={18} color={c.onGo} strokeWidth={3} />
            ) : (
              <>
                <Icon name="plus" size={16} color={met ? c.onGo : c.onAccent} />
                <T v="monoBold" color={met ? c.onGo : c.onAccent} style={{ fontSize: 14 }}>
                  1
                </T>
              </>
            )}
          </Pressable>
        </View>
      </View>
      {expanded ? <Lookback routine={r} onEdit={() => sheet.open((cl) => <RoutineForm id={r.id} close={cl} />, t('routineForm.editTitle'))} onDelete={() => sheet.open((cl) => <ConfirmDelete kind="routine" id={r.id} close={cl} />, t('confirm.label'))} /> : null}
    </View>
  );
}

function Lookback({ routine: r, onEdit, onDelete }: { routine: Routine; onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today } = useStore();
  const rv = routineReview(stats, r, today);
  const target = targetOf(r);
  const parts = [t(`routines.hits.${r.scope}`, { hits: rv.hits })];
  if (rv.run >= 2) parts.push(t('routines.inRow', { count: rv.run }));
  parts.push(t('routines.xpInfo', { xp: ROUT_XP[r.scope], bonus: ROUT_BONUS[r.scope] }));
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10, gap: 10 }}>
      <T v="eyebrow" muted>
        {t('routines.lookbackTitle')}
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {rv.entries.map((e) => (
          <View key={e.day} style={{ minWidth: 62, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, backgroundColor: e.hit ? c.goSoft : c.surface2, gap: 2 }}>
            <T v="tiny" style={{ fontSize: 12 }}>
              {shortPeriod(r.scope, e.day)}
            </T>
            <T v="monoBold" color={e.hit ? c.go : c.ink}>
              {e.count}/{target}
            </T>
          </View>
        ))}
      </ScrollView>
      <T v="small" muted>
        {parts.join(SEP)}
      </T>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip icon="edit" label={t('common.edit')} onPress={onEdit} />
        <Chip icon="trash" label={t('common.delete')} onPress={onDelete} />
      </View>
    </View>
  );
}

/** Daily goal ring card. With `editable` it shows the stepper (Routines tab), otherwise a link (Home). */
export function GoalCard({ editable }: { editable?: boolean }) {
  const { t } = useTranslation();
  const { stats, today, goal, actions } = useStore();
  const done = stats.checkinsByDay.get(today) || 0;
  const reached = goal > 0 && done >= goal;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Ring value={done} goal={goal}>
          <View style={{ alignItems: 'center' }}>
            <T style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22 }}>
              {done}/{goal}
            </T>
            <T v="tiny" muted style={{ fontSize: 11, lineHeight: 13, fontFamily: fonts.bodyBold }}>
              {editable ? t('routines.ringToday') : t('start.ringRoutines')}
            </T>
          </View>
        </Ring>
        <View style={{ flex: 1, gap: 6 }}>
          {editable ? (
            <>
              <T v="bold">{t('routines.goalTitle')}</T>
              <T v="small" muted>
                {t('routines.goalText', { xp: GOAL_BONUS })}
              </T>
              <Stepper value={goal} max={MAX_GOAL} onChange={actions.setGoal} decLabel={t('routines.goalDec')} incLabel={t('routines.goalInc')} />
            </>
          ) : (
            <>
              <T v="bold">{reached ? t('start.goalReached') : t('start.goal', { count: goal })}</T>
              <T v="small" muted>
                {reached ? t('start.goalBonusDone', { xp: GOAL_BONUS }) : t('start.goalRemaining', { count: Math.max(0, goal - done), xp: GOAL_BONUS })}
              </T>
              <LinkButton label={t('start.allRoutines')} onPress={() => router.navigate('/routines')} />
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

const SLOT_ICON: Record<SlotGroupKey, IconName> = { morning: 'sunrise', midday: 'sun', evening: 'moon', any: 'clock' };

/** Routines grouped by time of day; a flat list when no routine has a time of day. */
export function RoutineGroups({ list, mini }: { list: Routine[]; mini?: boolean }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today } = useStore();
  const groups = groupBySlot(list);
  const now = slotAt(hourNow());
  if (groups.length === 1 && groups[0].key === 'any') {
    return (
      <View style={{ gap: 10 }}>
        {groups[0].items.map((r) => (
          <RoutineCard key={r.id} routine={r} mini={mini} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      {groups.map((g) => {
        const met = g.items.filter((r) => periodCount(stats, r, today) >= targetOf(r)).length;
        const isNow = g.key === now;
        return (
          <View key={g.key} style={{ gap: 8 }}>
            <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }}>
              <Icon name={SLOT_ICON[g.key]} size={18} color={isNow ? c.plumText : c.muted} />
              <T v="smallBold" color={isNow ? c.ink : c.muted}>
                {t(`routines.slot.${g.key}`)}
              </T>
              {isNow ? (
                <View style={{ backgroundColor: c.tabActive, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 }}>
                  <T v="tiny" color={c.plumText} style={{ fontFamily: fonts.bodyBold, fontSize: 12 }}>
                    {t('routines.slot.now')}
                  </T>
                </View>
              ) : null}
              <View style={{ flex: 1 }} />
              <T v="mono" muted style={{ fontSize: 12 }}>
                {met}/{g.items.length}
              </T>
            </View>
            {g.items.map((r) => (
              <RoutineCard key={r.id} routine={r} mini={mini} />
            ))}
          </View>
        );
      })}
    </View>
  );
}
