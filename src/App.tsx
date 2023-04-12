import React, { useEffect, useMemo } from 'react';
import { useState } from 'react';
import './App.css';
import { Box, Button, ButtonSpinner, Code, Collapse, Flex, HStack, Image, Input, Spinner, Text, Textarea, useColorMode } from '@chakra-ui/react';


function App() {
  const url = "https://shreyj1729--wolfree-backend-root.modal.run"
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [intermediateURL, setIntermediateURL] = useState("")
  const [intermediateText, setIntermediateText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultCollapse, setResultCollapse] = useState(true)

  const parser = useMemo(() => { return new DOMParser() }, [])

  const submitQuery = async () => {
    setLoading(true)
    const encodedURL = encodeURI(url + "?input=" + encodeURIComponent(input))
    fetch(encodedURL, {
      method: "GET",
    }).then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        setError("Something went wrong ...")
      }
    }).then((text) => {
      if (text === undefined) {
        return
      }
      setResult(text)
      setLoading(false)
    }
    ).catch((error) => {
      setError(error)
      setLoading(false)
    });
  }

  // every time result changes, parse the XML to get url and text for intermediate steps
  useEffect(() => {

    const parseXML = (xml: string) => {
      xml = xml.replaceAll("\\n", ' ')
      if (xml[0] === '"') {
        xml = xml.slice(1, xml.length - 1)
      }
      if (xml[-1] === '"') {
        xml = xml.slice(0, xml.length - 2)
      }
      const doc: Document = parser.parseFromString(xml, "text/xml")
      const root = doc.firstElementChild
      if (root === null) return []

      return Array.from(root.children)
    }

    if (result === "") {
      return
    }

    const pods = parseXML(result)
    if (pods.length === 0) {
      return
    }

    const subpods = Array.from(pods[0].children)
    if (subpods.length === 0) {
      return
    }

    // check which subpod has title "Possible intermediate steps"
    const target_subpod = subpods.find((subpod: Element) => {
      return subpod.getAttribute("title") === "Possible intermediate steps"
    })
    if (target_subpod === undefined) {
      return
    }

    const img = target_subpod.firstElementChild
    if (img === null) {
      return
    }

    const text = img.getAttribute("alt")
    if (text === null) {
      return
    }

    setIntermediateURL(img.getAttribute("src") || "")
    setIntermediateText(text.replace("\\n", "\n") || "")
  }, [
    result,
    parser,
  ])

  return (
    <>
      <Box margin="auto" width="80%" padding="10px" marginTop="30px" textAlign={"center"}>
        <Text>
          <Text as="span" fontSize="6xl" fontWeight="medium" color="#dd1101">Wolfree</Text>
          <Text as="span" fontSize="6xl" fontWeight="medium" color="#ff7e00">Alpha</Text>
        </Text>
        <Flex w="100%">
          <Input
            p={2}
            mx={2}
            size="lg"
            fontWeight="semi-bold"
            placeholder="integrate sqrt(tan(x)) dx"
            borderColor={"#ffc12f"}
            borderWidth={3}
            shadow={"md"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                submitQuery()
              }
            }}
          />
          <Button isDisabled={loading}
            mx={2}
            bgColor="#fe6c02"
            color="white"
            type="submit"
            size="lg"
            onClick={submitQuery}>
            {loading ? <ButtonSpinner /> : <>Go</>}
          </Button>
        </Flex>

        {!!error ? <p>Error: {JSON.stringify(error)}</p> : null}

        {!!intermediateURL ? <>
          <Image width={(70 - (70 - 25) * 2.7 ^ (-intermediateText.length / 1000)) + "%"} m="auto" my={10} src={intermediateURL} alt="intermediate steps" />
          <Text>{intermediateText}</Text>
        </>
          : "Enter a query to get intermediate steps"}


        {!!result ? <><Button onClick={() => setResultCollapse(!resultCollapse)} my={5}>Show Raw Response</Button>
          <Collapse in={!resultCollapse}
          >
            <Code>{JSON.stringify(result)}</Code>
          </Collapse></> : null}

      </Box >
    </>
  );
}

export default App;
