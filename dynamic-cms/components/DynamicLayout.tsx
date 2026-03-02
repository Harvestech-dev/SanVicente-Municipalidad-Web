"use client";

import { useMemo, type ReactNode, type ComponentType } from "react";
import { useClientConfig } from "../contexts/ClientConfigProvider";
import { useCMSComponents } from "../hooks/useCMSComponents";
import { usePageCMS } from "../hooks/usePageCMS";
import type { CMSComponent } from "../types/cms-components";

/** Props base que recibe cada componente del layout (datos CMS + estado) */
export interface DynamicLayoutComponentProps {
  loading?: boolean;
  error?: string | null;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DynamicLayoutProps {
  /** Tipo de página; debe coincidir con el campo `page` de los componentes en el CMS */
  pageType?: string;
  /** Mapeo tipo CMS -> nombre de layout (ej: "hero_search" -> "hero-search") */
  cmsTypeToLayoutName: Record<string, string>;
  /** Mapeo nombre layout -> componente React. El proyecto de destino define sus propios componentes */
  componentMap: Record<string, ComponentType<DynamicLayoutComponentProps>>;
  /**
   * Función opcional para construir las props de cada componente.
   * Por defecto: { loading, error, data: cmsComponent.data, ..._configuracion }
   */
  getComponentProps?: (
    layoutName: string,
    cmsComponent: CMSComponent,
    context: {
      cmsLoading: boolean;
      cmsError: string | null;
      pageCMS: ReturnType<typeof usePageCMS>;
    }
  ) => DynamicLayoutComponentProps;
  /** Componente mostrado mientras carga config o CMS */
  LoadingComponent?: ComponentType<{ type?: string }> | ReactNode;
  /** Componente o mensaje cuando no hay componentes para la página */
  EmptyComponent?: ComponentType<{ pageType: string }> | ReactNode;
}

function defaultGetComponentProps(
  _layoutName: string,
  cmsComponent: CMSComponent,
  context: {
    cmsLoading: boolean;
    cmsError: string | null;
  }
): DynamicLayoutComponentProps {
  const config =
    cmsComponent?.data?._configuracion || cmsComponent?.data?.config || {};
  return {
    loading: context.cmsLoading,
    error: context.cmsError,
    data: cmsComponent?.data ?? {},
    ...config,
  };
}

/**
 * Layout dinámico que renderiza componentes según la respuesta del CMS.
 * El proyecto de destino debe proveer componentMap y cmsTypeToLayoutName con sus propios componentes.
 */
export function DynamicLayout({
  pageType = "Inicio",
  cmsTypeToLayoutName,
  componentMap,
  getComponentProps = defaultGetComponentProps,
  LoadingComponent,
  EmptyComponent,
}: DynamicLayoutProps) {
  const { config, loading: configLoading } = useClientConfig();
  const {
    components,
    loading: cmsLoading,
    error: cmsError,
    getComponentsByPage,
  } = useCMSComponents();
  const pageCMS = usePageCMS();

  const pageComponents = useMemo(() => {
    if (!components) return [];
    return getComponentsByPage(pageType);
  }, [components, pageType, getComponentsByPage]);

  const layoutComponents = useMemo(() => {
    if (cmsLoading || components === null) return [];
    if (!pageComponents.length) return [];

    const sorted = [...pageComponents].sort((a, b) => {
      const orderA = a.data?._orden ?? a.data?.order ?? null;
      const orderB = b.data?._orden ?? b.data?.order ?? null;
      if (orderA != null && orderB != null) return orderA - orderB;
      if (orderA != null) return -1;
      if (orderB != null) return 1;
      return 0;
    });

    return sorted.filter((c) => {
      const name = cmsTypeToLayoutName[c.type];
      return name !== undefined && componentMap[name] != null;
    });
  }, [pageComponents, cmsLoading, components, cmsTypeToLayoutName, componentMap]);

  if (configLoading && !config) {
    if (LoadingComponent) {
      return typeof LoadingComponent === "function" ? (
        <LoadingComponent type="config" />
      ) : (
        <>{LoadingComponent}</>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  if (layoutComponents.length === 0) {
    if (cmsLoading || components === null) {
      if (LoadingComponent) {
        return typeof LoadingComponent === "function" ? (
          <LoadingComponent type="cms" />
        ) : (
          <>{LoadingComponent}</>
        );
      }
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Cargando componentes...</p>
        </div>
      );
    }
    if (EmptyComponent) {
      return typeof EmptyComponent === "function" ? (
        <EmptyComponent pageType={pageType} />
      ) : (
        <>{EmptyComponent}</>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <p className="text-muted-foreground">
          No hay componentes configurados para la página &quot;{pageType}&quot;.
        </p>
        <p className="text-sm text-muted-foreground">
          Verifica que los componentes del CMS tengan el campo <code>page</code>{" "}
          igual a &quot;{pageType}&quot;.
        </p>
      </div>
    );
  }

  const getProps = getComponentProps ?? defaultGetComponentProps;

  return (
    <>
      {layoutComponents.map((cmsComponent, index) => {
        const layoutName =
          cmsComponent.type === "about-contact-split"
            ? "about-contact-split"
            : cmsTypeToLayoutName[cmsComponent.type] ?? cmsComponent.type;
        const Component = componentMap[layoutName];
        if (!Component) return null;

        const props = getProps(layoutName, cmsComponent, {
          cmsLoading,
          cmsError,
          pageCMS,
        });

        return (
          <Component
            key={`${cmsComponent.type}-${cmsComponent._id ?? index}`}
            {...props}
          />
        );
      })}
    </>
  );
}
