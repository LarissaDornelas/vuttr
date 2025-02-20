import React, { useCallback, useEffect, useState } from "react";

import { ActionPanel, BannerCritical, Card, Loading, Modal } from "components";
import {
  Title,
  Subtitle,
  Container,
  LoadingWrapper,
  EmptyWrapper,
} from "./styles";
import { api } from "services/api";
import { ITool } from "./types";
import { useDebounce } from "hooks";
import { RegisterToolForm } from "./components";
import { IFormValues } from "./components/RegisterToolForm/types";
import {
  BannerCriticalType,
  IBannerCritical,
} from "components/BannerCritical/types";

const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<ITool[]>();
  const [searchByTag, setSearchByTag] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [modalDeleteIsOpen, setModalDeleteIsOpen] = useState(false);
  const [modalCreateIsOpen, setModalCreateIsOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [toolToRemove, setToolToRemove] = useState<ITool>();
  const [bannerCritical, setBannerCritical] =
    useState<Omit<IBannerCritical, "onClose"> | null>(null);

  const debouncedSearch = useDebounce(searchInput, 500);

  const handleFetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tools");

      setTools(data);
    } catch (err) {
      setBannerCritical({
        type: BannerCriticalType.ERROR,
        message: "An error occurred while fetching data",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteTool = useCallback(async () => {
    setLoadingDelete(true);
    try {
      await api.delete(`/tools/${toolToRemove?.id}`);
      setTools((oldValues) =>
        oldValues?.filter((tool) => tool.id !== toolToRemove?.id)
      );
    } catch (err) {
      setBannerCritical({
        type: BannerCriticalType.ERROR,
        message: "An error occurred while deleting tool",
      });
    } finally {
      setToolToRemove(undefined);
      setModalDeleteIsOpen(false);
      setLoadingDelete(false);
      setBannerCritical({
        type: BannerCriticalType.SUCCESS,
        message: "Successfuly Deleted",
      });
    }
  }, [toolToRemove]);

  const handleToolToRemove = useCallback(
    (id: string) => {
      const [filteredTool] = tools?.filter((tool) => tool.id === id) ?? [];
      setToolToRemove(filteredTool);
    },
    [tools]
  );

  const handleSearch = useCallback(async () => {
    try {
      const query = searchByTag ? "tag=" : "search=";
      const { data } = await api.get(`/tools?${query}${debouncedSearch}`);

      setTools(data);
    } catch (err) {
      setBannerCritical({
        type: BannerCriticalType.ERROR,
        message: "An error occurred while searching",
      });
    }
  }, [searchByTag, debouncedSearch]);

  const handleAdd = useCallback(
    async (values: IFormValues) => {
      try {
        let tags = values.tags.split(",");
        tags = tags.map((tag) => tag.trim());

        await api.post("/tools", { ...values, tags });
        handleFetchData();
      } catch (err) {
        setBannerCritical({
          type: BannerCriticalType.ERROR,
          message: "An error occurred while saving values",
        });
      } finally {
        setModalCreateIsOpen(false);
        setBannerCritical({
          type: BannerCriticalType.SUCCESS,
          message: "Successfuly Created",
        });
      }
    },
    [handleFetchData]
  );

  useEffect(() => {
    if (bannerCritical) {
      setTimeout(() => {
        setBannerCritical(null);
      }, 5000);
    }
  }, [bannerCritical]);

  useEffect(() => {
    if (debouncedSearch) {
      handleSearch();
    } else {
      handleFetchData();
    }
  }, [debouncedSearch, handleFetchData]); //eslint-disable-line

  useEffect(() => {
    if (toolToRemove) {
      setModalDeleteIsOpen(true);
    }
  }, [toolToRemove]);

  return (
    <>
      <Container>
        <Title>vuttr</Title>
        <Subtitle>Very Useful Tools to Remember</Subtitle>
        <ActionPanel
          handleSearch={(value: string) => setSearchInput(value)}
          onClickAddButton={() => setModalCreateIsOpen(true)}
          handleSearchByTag={(value: boolean) => setSearchByTag(value)}
        />

        {!loading ? (
          tools && tools?.length > 0 ? (
            tools?.map((tool) => (
              <Card
                key={tool.id}
                tool={tool}
                removeAction={handleToolToRemove}
              />
            ))
          ) : (
            <EmptyWrapper>Não há ferramentas</EmptyWrapper>
          )
        ) : (
          <LoadingWrapper>
            <Loading />
          </LoadingWrapper>
        )}

        {modalDeleteIsOpen && (
          <Modal
            title="Remove Tool"
            actionConfirm={handleDeleteTool}
            onClose={() => {
              setToolToRemove(undefined);
              setModalDeleteIsOpen(false);
            }}
            loading={loadingDelete}
          >
            Are you sure you want to remove {toolToRemove?.title}?
          </Modal>
        )}

        {modalCreateIsOpen && (
          <RegisterToolForm
            handleSubmit={handleAdd}
            onClose={() => setModalCreateIsOpen(false)}
          />
        )}
      </Container>
      {bannerCritical && (
        <BannerCritical
          type={bannerCritical.type}
          message={bannerCritical.message}
          onClose={() => setBannerCritical(null)}
        />
      )}
    </>
  );
};

export default Home;
