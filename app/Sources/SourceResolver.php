<?php

namespace App\Sources;

class SourceResolver
{
    /** @param  array<int, Source>  $sources */
    public function __construct(private array $sources) {}

    /**
     * Returns [Source, id], or null if nothing recognizes the URL — which the
     * controller turns into a 422, the job the old zod .refine() did.
     *
     * @return array{0: Source, 1: string}|null
     */
    public function resolve(string $url): ?array
    {
        foreach ($this->sources as $source) {
            if ($id = $source->extractId($url)) {
                return [$source, $id];
            }
        }

        return null;
    }
}
