import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchLeagues,
  selectLeagues,
  selectLeagueLoading,
} from '../../../../shared/store/leagueSlice';
import { selectUser } from '../../../../shared/store/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../../../shared/constants/app';

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const leagues = useSelector(selectLeagues);
  const loading = useSelector(selectLeagueLoading);

  useEffect(() => {
    dispatch(fetchLeagues());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchLeagues());
  };

  const stats = useMemo(() => {
    const activeLeagues = leagues.filter(l => l.status === 'active').length;
    const totalSpent = leagues.reduce((sum, league) => {
      const userTeams = league.teams?.filter(team => team.owner === user?.id) || [];
      return sum + userTeams.reduce((teamSum, team) => teamSum + (team.purchasePrice || 0), 0);
    }, 0);
    const teamsOwned = leagues.reduce((sum, league) => {
      return sum + (league.teams?.filter(team => team.owner === user?.id)?.length || 0);
    }, 0);

    return {
      activeLeagues,
      totalSpent,
      teamsOwned,
      totalWinnings: user?.totalWinnings || 0,
    };
  }, [leagues, user]);

  const StatCard = ({ title, value, icon, color = COLORS.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const LeagueCard = ({ league }) => (
    <TouchableOpacity
      style={styles.leagueCard}
      onPress={() => navigation.navigate('LeaguesTab', {
        screen: 'LeagueDetail',
        params: { leagueId: league._id, leagueName: league.name }
      })}
    >
      <View style={styles.leagueHeader}>
        <Text style={styles.leagueName}>{league.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(league.status) }]}>
          <Text style={styles.statusText}>{league.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.leagueDescription} numberOfLines={2}>
        {league.description || 'No description'}
      </Text>
      <View style={styles.leagueStats}>
        <Text style={styles.leagueStatText}>
          {league.memberCount} members
        </Text>
        <Text style={styles.leagueStatText}>
          Code: {league.inviteCode}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'auction': return COLORS.warning;
      case 'completed': return COLORS.gray[500];
      default: return COLORS.gray[400];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}!</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Active Leagues"
            value={stats.activeLeagues}
            icon="👥"
            color={COLORS.primary}
          />
          <StatCard
            title="Teams Owned"
            value={stats.teamsOwned}
            icon="🏈"
            color={COLORS.success}
          />
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toLocaleString()}`}
            icon="💰"
            color={COLORS.warning}
          />
          <StatCard
            title="Total Winnings"
            value={`$${stats.totalWinnings.toLocaleString()}`}
            icon="🏆"
            color={COLORS.secondary}
          />
        </View>

        {/* Recent Leagues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Leagues</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LeaguesTab')}
            >
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {leagues.length > 0 ? (
            <View style={styles.leaguesContainer}>
              {leagues.slice(0, 3).map((league) => (
                <LeagueCard key={league._id} league={league} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateTitle}>No Leagues Yet</Text>
              <Text style={styles.emptyStateDescription}>
                Join or create your first league to get started!
              </Text>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('LeaguesTab', { screen: 'CreateLeague' })}
                >
                  <Text style={styles.primaryButtonText}>Create League</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('LeaguesTab', { screen: 'JoinLeague' })}
                >
                  <Text style={styles.secondaryButtonText}>Join League</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('LeaguesTab', { screen: 'CreateLeague' })}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Create League</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('LeaguesTab', { screen: 'JoinLeague' })}
            >
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionText}>Join League</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('TeamsTab')}
            >
              <Text style={styles.actionIcon}>🏈</Text>
              <Text style={styles.actionText}>Browse Teams</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  greeting: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray[600],
  },
  userName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  statsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  statTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  sectionLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  leaguesContainer: {
    gap: SPACING.md,
  },
  leagueCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  leagueName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  leagueDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.sm,
  },
  leagueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leagueStatText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
});
