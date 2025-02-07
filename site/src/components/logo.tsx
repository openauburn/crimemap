/* eslint-disable */
import { Flex, Title } from "@mantine/core";

import Image from "next/image";

interface logoProps {
  includeIcon: boolean;
  includeTitle: boolean;
}

export default function OpenAuburnLogo(props: any) {
  return (
    <Flex direction="row" align="center">
      {props.includeIcon === undefined || props.includeIcon !== false ? (
        <Image
          width={28}
          height={28}
          style={{ objectFit: "contain" }}
          alt={"logo"}
          src={"/static/images/openauburnlogo.png"}
        />
      ) : null}
      {props.includeTitle === undefined || props.includeTitle !== false ? (
        <Title order={3}>Open Auburn</Title>
      ) : null}
    </Flex>
  );
}
