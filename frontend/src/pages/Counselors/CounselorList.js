import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Chip,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Rating,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  VideoCall as VideoCallIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import axios from 'axios';

const CounselorList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    specialty: '',
    minFee: '',
    maxFee: '',
    method: '',
    sortBy: 'rating',
    search: '',
  });

  // 상담사 목록 조회
  const {
    data: counselorsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['counselors', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/counselors?${params}`);
      return response.data.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5분간 캐시
    }
  );

  // 실시간 상담사 상태 업데이트 리스너
  useEffect(() => {
    const handleCounselorStatusUpdate = (event) => {
      const { counselorId, isOnline } = event.detail;
      // 상담사 상태 업데이트 로직
      refetch();
    };

    window.addEventListener('counselor-status-update', handleCounselorStatusUpdate);
    return () => {
      window.removeEventListener('counselor-status-update', handleCounselorStatusUpdate);
    };
  }, [refetch]);

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // 필터 변경 시 첫 페이지로
    }));
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // 상담사 카드 컴포넌트
  const CounselorCard = ({ counselor }) => {
    const getMethodIcon = (method) => {
      switch (method) {
        case 'video': return <VideoCallIcon />;
        case 'voice': return <PhoneIcon />;
        case 'chat': return <ChatIcon />;
        default: return null;
      }
    };

    const getSpecialtyColor = (specialty) => {
      const colors = {
        depression: 'primary',
        anxiety: 'secondary',
        trauma: 'error',
        relationship: 'success',
        family: 'warning',
        couple: 'info',
        child: 'primary',
        addiction: 'secondary',
      };
      return colors[specialty] || 'default';
    };

    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              src={counselor.avatar}
              alt={counselor.name}
              sx={{ width: 60, height: 60, mr: 2 }}
            >
              {counselor.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="h2">
                {counselor.name}
              </Typography>
              <Box display="flex" alignItems="center" mt={0.5}>
                <Rating
                  value={counselor.rating.average}
                  precision={0.1}
                  size="small"
                  readOnly
                />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  ({counselor.rating.count})
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            경력 {counselor.experience}년 • {counselor.stats.completedSessions}회 상담
          </Typography>

          <Box mb={2}>
            {counselor.specialties.slice(0, 3).map((specialty) => (
              <Chip
                key={specialty}
                label={specialty}
                size="small"
                color={getSpecialtyColor(specialty)}
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {counselor.specialties.length > 3 && (
              <Chip
                label={`+${counselor.specialties.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            {counselor.introduction}
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" gap={0.5}>
              {counselor.methods.map((method) => (
                <Chip
                  key={method}
                  icon={getMethodIcon(method)}
                  label={method}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
            <Typography variant="h6" color="primary">
              {counselor.fee.toLocaleString()}원
            </Typography>
          </Box>
        </CardContent>

        <CardActions>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate(`/counselors/${counselor.id}`)}
          >
            상세보기
          </Button>
        </CardActions>
      </Card>
    );
  };

  // 로딩 스켈레톤
  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(12)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Skeleton variant="circular" width={60} height={60} />
                <Box ml={2} flex={1}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          상담사 목록을 불러오는 중 오류가 발생했습니다.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        상담사 찾기
      </Typography>

      {/* 검색 및 필터 */}
      <Box mb={4}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="상담사 이름으로 검색"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>전문분야</InputLabel>
              <Select
                value={filters.specialty}
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="depression">우울증</MenuItem>
                <MenuItem value="anxiety">불안장애</MenuItem>
                <MenuItem value="trauma">트라우마</MenuItem>
                <MenuItem value="relationship">인간관계</MenuItem>
                <MenuItem value="family">가족문제</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>상담방식</InputLabel>
              <Select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="video">화상상담</MenuItem>
                <MenuItem value="voice">음성상담</MenuItem>
                <MenuItem value="chat">채팅상담</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>정렬</InputLabel>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="rating">평점순</MenuItem>
                <MenuItem value="experience">경력순</MenuItem>
                <MenuItem value="fee-low">가격 낮은순</MenuItem>
                <MenuItem value="fee-high">가격 높은순</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* 상담사 목록 */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <Grid container spacing={3}>
            {counselorsData?.counselors?.map((counselor) => (
              <Grid item xs={12} sm={6} md={4} key={counselor.id}>
                <CounselorCard counselor={counselor} />
              </Grid>
            ))}
          </Grid>

          {/* 페이지네이션 */}
          {counselorsData?.pagination && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={counselorsData.pagination.pages}
                page={counselorsData.pagination.current}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default CounselorList;