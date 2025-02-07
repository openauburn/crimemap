/* eslint-disable */
"use client";
import {
  Box,
  MultiSelect,
  MultiSelectProps,
  SimpleGrid,
  useMantineTheme,
  Text,
  ActionIcon,
  Stack,
  Loader,
  Modal,
  Paper,
  Group,
  Badge,
  Title,
  UnstyledButton,
  Spoiler,
} from "@mantine/core";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { LineChart } from "@mantine/charts";
import OpenAuburnLogo from "../components/logo";
import {
  IconAdjustmentsHorizontal,
  IconChartHistogram,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import Link from "next/link";

export default function Home() {
  const theme = useMantineTheme();

  const [modalState, setModalState] = useState<string>("filter");
  const [opened, { open, close }] = useDisclosure(false);
  const [crimeData, setCrimeData] = useState<any>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filteredCrimeData, setFilteredCrimeData] = useState<any>({});
  const [filteredTimeseries, setFilteredTimeseries] = useState<any>({
    data: [],
    series: [],
  });

  useEffect(() => {
    fetch("/api/crime_data")
      .then((res) => res.json())
      .then((data) => {
        setCrimeData(data.data);
        setFilteredCrimeData(data.data);
      });
  }, []);

  useEffect(() => {
    let cd = structuredClone(crimeData);
    if (selectedTypes.length > 0) {
      let incident_dist = Object.fromEntries(
        Object.entries(cd.incident_dist).filter(([key]) =>
          selectedTypes.includes(key)
        )
      );

      const count = Object.values(incident_dist).reduce(
        (sum: any, val: any) => sum + val,
        0
      );

      let latlong = Object.entries(cd.latlong).reduce(
        (acc, [latlong, details]: [any, any]) => {
          // Filter 'dist' keys
          const filteredDist = Object.fromEntries(
            Object.entries(details.dist).filter(([key]) =>
              selectedTypes.includes(key)
            )
          );

          // Recalculate count
          const newCount = Object.values(filteredDist).reduce(
            (sum: any, val: any) => sum + val,
            0
          );

          // Update the structure
          acc[latlong] = { count: newCount, dist: filteredDist };
          return acc;
        },
        {} as Record<string, { count: any; dist: any }>
      );

      setFilteredCrimeData({
        ...cd, // Copy the existing structure
        count,
        latlong,
        incident_dist,
      });

      setFilteredTimeseries({
        data: Object.entries(filteredCrimeData.monthly).map(
          ([month, obj]: [any, any]) => ({
            month: month,
            ...obj["incident_dist"],
          })
        ),

        series: selectedTypes.map((type, index) => ({
          name: type,
          color: getModuloThemeColor(index),
        })),
      });
    } else {
      setFilteredCrimeData(cd);
      if (cd.monthly) {
        setFilteredTimeseries({
          data: Object.entries(cd.monthly).map(([month, obj]: [any, any]) => ({
            month: month,
            all: obj.count,
          })),
          series: [
            {
              name: "all",
              color: "indigo.5",
            },
          ],
        });
      }
    }
  }, [selectedTypes]);

  const getModuloThemeColor = (index: number): string => {
    const colorKeys = Object.keys(theme.colors).filter(
      (key) => key !== "dark" && key !== "gray"
    );
    const colorKey = colorKeys[index % colorKeys.length]; // Select color based on modulo index
    const shade = (index % 4) + 3; // Ensures shade is between 3 and 6

    return theme.colors[colorKey]?.[shade] || ""; // Return the color or empty string if not found
  };
  const Map = useMemo(
    () =>
      dynamic(() => import("../components/map/"), {
        loading: () => (
          <Box
            style={{
              height: "100vh",
              width: "100vw",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Loader size={75} />
          </Box>
        ),
        ssr: false,
      }),
    []
  );

  const incidents = useMemo(() => {
    if (crimeData.monthly) {
      setFilteredTimeseries({
        data: Object.entries(crimeData.monthly).map(
          ([month, obj]: [any, any]) => ({
            month: month,
            all: obj.count,
          })
        ),
        series: [
          {
            name: "all",
            color: "indigo.6",
          },
        ],
      });
    }

    return crimeData?.incident_dist
      ? Object.entries(crimeData.incident_dist).map(
          ([key, value]: [any, any]) => {
            return key;
          }
        )
      : [];
  }, [crimeData]);

  const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({
    option,
  }) => {
    let i_type = option.value;
    let count: number = crimeData.incident_dist[i_type];
    let maxCount: number = Math.max(
      ...Object.entries(crimeData.incident_dist).map(
        ([key, value]: [any, any]) => value,
        0
      )
    );
    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return (
      <Box key={i_type} mb={8} style={{ position: "relative", width: "100%" }}>
        {/* Text on top of the bar */}
        <Text
          w={500}
          style={{
            position: "absolute",
            top: "50%",
            left: "10px", // Adjust this for left alignment of text
            transform: "translateY(-50%)", // To center the text vertically
            zIndex: 1, // Ensure text is above the bar
          }}
        >
          {i_type} - {count}
        </Text>

        {/* The Bar */}
        <Box
          style={{
            width: `${barWidth}%`,
            backgroundColor: "var(--mantine-color-blue-1)",
            height: "25px",
            borderRadius: "5px 5px 5px 5px",
            position: "relative",
          }}
        />
      </Box>
    );
  };

  interface ChartTooltipProps {
    label: string;
    payload: Record<string, any>[] | undefined;
  }

  function ChartTooltip({ label, payload }: ChartTooltipProps) {
    if (!payload) return null;

    return (
      <Paper px="md" py="sm" withBorder shadow="md" radius="md">
        <Text fw={500} mb={5}>
          {label}
        </Text>
        {payload.map((item: any) => (
          <Text key={item.name} c={item.color} fz="sm">
            {item.name}: {item.value}
          </Text>
        ))}
      </Paper>
    );
  }

  const isSmallScreen = useMediaQuery("(max-width: 500px)");
  const isMedScreen = useMediaQuery("(max-width: 900px)");

  const modals: any = {
    filter: (
      <MultiSelect
        style={{
          width: isSmallScreen ? "300px" : "400px",
        }}
        label="Criminal Incident Types"
        placeholder="Select type"
        data={incidents}
        value={selectedTypes}
        onChange={setSelectedTypes}
        renderOption={renderMultiSelectOption}
        clearable
        searchable
        hidePickedOptions
      />
    ),

    timechart: (
      <Stack gap={0} align="center">
        <LineChart
          h={450}
          data={filteredTimeseries.data}
          dataKey="month"
          style={{ width: "50vw" }}
          series={filteredTimeseries.series}
          curveType="monotone"
          gridAxis="xy"
          tooltipProps={{
            content: ({ label, payload }) => (
              <ChartTooltip label={label} payload={payload} />
            ),
          }}
          withXAxis={!isMedScreen}
          withYAxis={!isMedScreen}
          withDots={!isMedScreen}
        />
        <SimpleGrid cols={1} spacing="xs">
          {filteredTimeseries.series.map((item: any) => (
            <Group key={item.name}>
              {/* Color Circle */}
              <Badge
                size="xs"
                color={item.color}
                circle
                style={{ color: item.color }}
              />
              {/* Label */}
              <Text size="sm">{item.name}</Text>
            </Group>
          ))}
        </SimpleGrid>
      </Stack>
    ),
    about: (
      <Box style={{ width: "30vw" }}>
        <Title order={3}>Auburn University Crime Map</Title>
        <Text>
          This crime heatmap is an interactive tool that visualizes crime data
          around Auburn University. The data is served from{" "}
          <Link href={"https://www.openauburn.org/datasets/1"} target="_blank">
            Open Auburn
          </Link>
          . You can click on the map to see the top 5 crime types within a
          50-meter radius. Use the{" "}
          <ActionIcon
            variant="white"
            size="md"
            radius="md"
            aria-label="Timeseries"
            onClick={() => {
              console.log("hi");
              setModalState("timechart");
              open();
            }}
          >
            <IconChartHistogram
              style={{ width: "70%", height: "70%" }}
              stroke={1.5}
            />
          </ActionIcon>{" "}
          icon to view crime trends over time, and the
          <ActionIcon
            variant="white"
            size="md"
            radius="md"
            aria-label="Filter"
            onClick={() => {
              console.log("hi");
              setModalState("filter");
              open();
            }}
          >
            <IconAdjustmentsHorizontal
              style={{ width: "70%", height: "70%" }}
              stroke={1.5}
            />
          </ActionIcon>
          icon to filter by incident type.
          <br />
          <br />
          Source:{" "}
          <Link href={"https://github.com/openauburn/crimemap"} target="_blank">
            https://github.com/openauburn/crimemap
          </Link>
        </Text>
      </Box>
    ),
  };

  return (
    <>
      <div>
        <Modal
          opened={opened}
          onClose={close}
          centered
          title={
            modalState.charAt(0).toUpperCase() +
            modalState.slice(1).toLowerCase()
          }
          size={"auto"}
          style={{ width: "100%", display: "grid", placeItems: "center" }}
        >
          {/* Modal content */}
          {modals[modalState]}
        </Modal>
        <Box style={{ height: "100vh", width: "100vw", position: "relative" }}>
          <Map data={filteredCrimeData} />

          <Box
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
            }}
          >
            <Stack align="flex-end">
              <UnstyledButton
                component="a"
                href="https://www.openauburn.org/"
                variant="default"
                target="_blank"
                style={{
                  height: "100%",
                  backgroundColor: "white",
                  padding: "0.5rem 0.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
                }}
              >
                <OpenAuburnLogo includeIcon includeTitle={false} />
              </UnstyledButton>
              <ActionIcon
                variant="white"
                size="xl"
                radius="md"
                aria-label="Filter"
                style={{ boxShadow: "0 4px 10px rgba(0, 0, 0, 0.35)" }}
                onClick={() => {
                  console.log("hi");
                  setModalState("filter");
                  open();
                }}
              >
                <IconAdjustmentsHorizontal
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>

              <ActionIcon
                variant="white"
                size="xl"
                radius="md"
                aria-label="Timeseries"
                style={{ boxShadow: "0 4px 10px rgba(0, 0, 0, 0.35)" }}
                onClick={() => {
                  console.log("hi");
                  setModalState("timechart");
                  open();
                }}
              >
                <IconChartHistogram
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
              <ActionIcon
                variant="white"
                size="xl"
                radius="md"
                aria-label="About"
                style={{ boxShadow: "0 4px 10px rgba(0, 0, 0, 0.35)" }}
                onClick={() => {
                  console.log("hi");
                  setModalState("about");
                  open();
                }}
              >
                <IconInfoCircle
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Stack>
          </Box>

          <Box
            style={{
              position: "absolute",
              bottom: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "white",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            {selectedTypes.length > 0 ? (
              <>
                <Spoiler
                  maxHeight={100}
                  showLabel={<Text size="xs">Show more</Text>}
                  hideLabel={<Text size="xs">Hide</Text>}
                >
                  <Stack gap={0} align="center">
                    <Text c="dimmed" size="xs">
                      Showing:
                    </Text>
                    {selectedTypes.map((type: any) => (
                      <Text size="xs">{type}</Text>
                    ))}
                  </Stack>
                </Spoiler>
              </>
            ) : (
              <></>
            )}
            <Group>
              <Text size="sm">Low</Text>
              <Box
                style={{
                  width: 200, // Full width
                  height: 10, // Adjust thickness of the bar
                  borderRadius: "15px", // Round the corners
                  background:
                    "linear-gradient(to left, #FF0200, #FCEA2B, #53FF81, #67FDF8, #8484CD)",
                }}
              />
              <Text size="sm">High</Text>
            </Group>
          </Box>
        </Box>
      </div>
    </>
  );
}
