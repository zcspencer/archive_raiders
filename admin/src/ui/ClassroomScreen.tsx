import { useEffect, useMemo, useState, type ReactElement } from "react";
import type {
  Classroom,
  ClassroomInviteSummary,
  ClassroomStudentEconomy,
  ClassroomStudentSummary
} from "@odyssey/shared";
import {
  Badge,
  Box,
  Button,
  CloseButton,
  Flex,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { getClassroom } from "../api/classrooms";
import { listClassroomInvites } from "../api/invites";
import { getClassroomStudentEconomy, listClassroomStudents } from "../api/students";

interface ClassroomScreenProps {
  accessToken: string;
}

/**
 * Classroom detail screen showing students, invites, and student economy drawer.
 */
export function ClassroomScreen(props: ClassroomScreenProps): ReactElement {
  const params = useParams<{ classroomId: string }>();
  const classroomId = params.classroomId ?? "";
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudentSummary[]>([]);
  const [invites, setInvites] = useState<ClassroomInviteSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ClassroomStudentSummary | null>(null);
  const [studentEconomy, setStudentEconomy] = useState<ClassroomStudentEconomy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomId) {
      setErrorMessage("Missing classroom id");
      return;
    }
    void refreshClassroomData(
      props.accessToken,
      classroomId,
      setClassroom,
      setStudents,
      setInvites,
      setErrorMessage,
      setIsLoading
    );
  }, [props.accessToken, classroomId]);

  const inviteCards = useMemo(
    () =>
      invites.map((invite) => {
        const status = deriveInviteStatus(invite);
        return (
          <Box borderWidth="1px" borderRadius="md" p={3} key={invite.id}>
            <HStack justify="space-between" align="start">
              <Stack gap={0}>
                <Text fontWeight="semibold">{invite.email}</Text>
                <Text fontSize="sm" color="fg.muted">
                  Sent {new Date(invite.createdAt).toLocaleString()}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  Expires {new Date(invite.expiresAt).toLocaleString()}
                </Text>
              </Stack>
              <Badge colorPalette={status.color}>{status.label}</Badge>
            </HStack>
          </Box>
        );
      }),
    [invites]
  );

  const handleStudentClick = async (student: ClassroomStudentSummary): Promise<void> => {
    if (!classroomId) {
      return;
    }
    setSelectedStudent(student);
    setIsDrawerLoading(true);
    try {
      const economy = await getClassroomStudentEconomy(props.accessToken, classroomId, student.userId);
      setStudentEconomy(economy);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load student details");
      setStudentEconomy(null);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={4}>
        <Stack gap={0}>
          <Heading size="lg">{classroom?.name ?? "Classroom"}</Heading>
          <Text color="fg.muted">Manage students, invites, inventory, and currency.</Text>
        </Stack>
        <HStack>
          <Button asChild variant="outline">
            <Link to="/">Back to dashboard</Link>
          </Button>
          <Button
            onClick={() =>
              refreshClassroomData(
                props.accessToken,
                classroomId,
                setClassroom,
                setStudents,
                setInvites,
                setErrorMessage,
                setIsLoading
              )
            }
            loading={isLoading}
          >
            Refresh
          </Button>
        </HStack>
      </HStack>

      {errorMessage ? (
        <Text color="red.500" mb={4}>
          {errorMessage}
        </Text>
      ) : null}

      <Flex gap={4} align="start">
        <Box flex="1" borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="md" mb={3}>
            Students
          </Heading>
          {isLoading ? <Spinner /> : null}
          <Stack gap={2}>
            {students.map((student) => (
              <Button
                key={student.userId}
                justifyContent="space-between"
                variant="outline"
                onClick={() => {
                  void handleStudentClick(student);
                }}
              >
                <Stack gap={0} align="start">
                  <Text>{student.displayName}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {student.email}
                  </Text>
                </Stack>
                <Text fontSize="sm" color="fg.muted">
                  Joined {new Date(student.membershipCreatedAt).toLocaleDateString()}
                </Text>
              </Button>
            ))}
            {!isLoading && students.length === 0 ? (
              <Text color="fg.muted">No students enrolled yet.</Text>
            ) : null}
          </Stack>
        </Box>

        <Box flex="1" borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="md" mb={3}>
            Invites
          </Heading>
          <Stack gap={2}>
            {inviteCards}
            {!isLoading && invites.length === 0 ? (
              <Text color="fg.muted">No invites sent yet.</Text>
            ) : null}
          </Stack>
        </Box>
      </Flex>

      {selectedStudent ? (
        <Box
          position="fixed"
          top="0"
          right="0"
          h="100vh"
          w={{ base: "100%", md: "420px" }}
          bg="bg.panel"
          borderLeftWidth="1px"
          p={5}
          zIndex={1000}
          overflowY="auto"
        >
          <HStack justify="space-between" mb={3}>
            <Heading size="md">{selectedStudent.displayName}</Heading>
            <CloseButton
              onClick={() => {
                setSelectedStudent(null);
                setStudentEconomy(null);
              }}
            />
          </HStack>
          <Text color="fg.muted" mb={4}>
            {selectedStudent.email}
          </Text>

          <Heading size="sm" mb={2}>
            Currency
          </Heading>
          {isDrawerLoading ? (
            <Spinner />
          ) : (
            <Stack mb={5}>
              <Text>Coins: {studentEconomy?.currency.coins ?? 0}</Text>
              <Text>Museum points: {studentEconomy?.currency.museum_points ?? 0}</Text>
            </Stack>
          )}

          <Heading size="sm" mb={2}>
            Inventory
          </Heading>
          {isDrawerLoading ? (
            <Spinner />
          ) : (
            <Stack gap={2}>
              {(studentEconomy?.inventory ?? []).map((item) => (
                <Box borderWidth="1px" borderRadius="md" p={2} key={item.instanceId}>
                  <Text fontWeight="semibold">{item.definitionId}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    Qty {item.quantity} (v{item.definitionVersion})
                  </Text>
                </Box>
              ))}
              {(studentEconomy?.inventory ?? []).length === 0 ? (
                <Text color="fg.muted">Inventory is empty.</Text>
              ) : null}
            </Stack>
          )}
        </Box>
      ) : null}
    </Box>
  );
}

async function refreshClassroomData(
  accessToken: string,
  classroomId: string,
  setClassroom: (value: Classroom | null) => void,
  setStudents: (value: ClassroomStudentSummary[]) => void,
  setInvites: (value: ClassroomInviteSummary[]) => void,
  setErrorMessage: (value: string | null) => void,
  setIsLoading: (value: boolean) => void
): Promise<void> {
  if (!classroomId) {
    setErrorMessage("Missing classroom id");
    return;
  }
  setIsLoading(true);
  setErrorMessage(null);
  try {
    const [classroom, students, invites] = await Promise.all([
      getClassroom(accessToken, classroomId),
      listClassroomStudents(accessToken, classroomId),
      listClassroomInvites(accessToken, classroomId)
    ]);
    setClassroom(classroom);
    setStudents(students);
    setInvites(invites);
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : "Failed to load classroom data");
  } finally {
    setIsLoading(false);
  }
}

function deriveInviteStatus(invite: ClassroomInviteSummary): {
  label: "Pending" | "Accepted" | "Expired";
  color: "blue" | "green" | "red";
} {
  if (invite.acceptedAt) {
    return { label: "Accepted", color: "green" };
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return { label: "Expired", color: "red" };
  }
  return { label: "Pending", color: "blue" };
}
